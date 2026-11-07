from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Portfolio, SearchHistory, Stock, Transaction, Wallet
from .serializers import TradeSerializer, TransactionSerializer
from .util import get_stock_info, get_stock_price, get_stock_prices, resolve_symbol


def _error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=code)


def _validation_error(serializer):
    first = next(iter(serializer.errors.values()))
    message = first[0] if isinstance(first, (list, tuple)) else first
    return _error(str(message))


def _holdings(user):
    """The user's holdings with live prices, plus the summed market value."""
    portfolios = list(Portfolio.objects.filter(user=user, quantity__gt=0).select_related("stock"))
    prices = get_stock_prices([p.stock.symbol for p in portfolios])

    data, total_value = [], 0.0
    for p in portfolios:
        current = prices.get(p.stock.symbol)
        value = current * p.quantity if current else 0
        data.append({
            "symbol": p.stock.symbol,
            "quantity": p.quantity,
            "avg_price": p.avg_price,
            "current_price": current,
            "total_value": value,
            "gain_loss": (current - p.avg_price) * p.quantity if current else 0,
        })
        total_value += value
    return data, total_value


# ==============================================================================
# Read endpoints
# ==============================================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    wallet = Wallet.for_user(request.user)
    holdings, total_value = _holdings(request.user)
    recent = (
        Transaction.objects.filter(user=request.user)
        .select_related("stock")
        .order_by("-created_at")[:5]
    )
    return Response({
        "wallet_balance": wallet.amount,
        "total_portfolio_value": total_value,
        "net_worth": wallet.amount + total_value,
        "holdings_count": len(holdings),
        "recent_transactions": TransactionSerializer(recent, many=True).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def portfolio_view(request):
    wallet = Wallet.for_user(request.user)
    holdings, total_value = _holdings(request.user)
    return Response({
        "holdings": holdings,
        "wallet_balance": wallet.amount,
        "total_portfolio_value": total_value,
        "net_worth": wallet.amount + total_value,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_view(request):
    transactions = (
        Transaction.objects.filter(user=request.user)
        .select_related("stock")
        .order_by("-created_at")
    )
    return Response(TransactionSerializer(transactions, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quote(request):
    symbol = request.GET.get("symbol", "").upper().strip()
    if not symbol:
        return _error("No symbol provided")

    try:
        info = get_stock_info(symbol)
    except Exception:
        return _error("Could not fetch quote right now. Please try again.", status.HTTP_502_BAD_GATEWAY)

    if not info.get("price"):
        return _error(f"Could not find a price for '{symbol}'.", status.HTTP_404_NOT_FOUND)

    SearchHistory.objects.update_or_create(
        user=request.user,
        symbol=info["symbol"],
        defaults={"name": info.get("name", ""), "exchange": info.get("exchange", "")},
    )
    return Response(info)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def suggestions(request):
    query = request.GET.get("q", "").upper().strip()
    fields = ("symbol", "name", "exchange")

    if not query:
        # Recent searches when the input is empty/focused
        return Response(list(SearchHistory.objects.filter(user=request.user).values(*fields)[:6]))

    mine = list(
        SearchHistory.objects.filter(user=request.user, symbol__istartswith=query).values(*fields)[:6]
    )
    if len(mine) >= 3:
        return Response(mine)

    # Fewer than 3 personal matches: top up with other users' searches, de-duplicated by symbol
    others = (
        SearchHistory.objects.filter(symbol__istartswith=query)
        .exclude(user=request.user)
        .values(*fields)
        .distinct()[:6]
    )
    seen = {r["symbol"] for r in mine}
    for r in others:
        if r["symbol"] not in seen:
            mine.append(r)
            seen.add(r["symbol"])
    return Response(mine[:6])


# ==============================================================================
# Trading
# ==============================================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def buy_stock(request):
    serializer = TradeSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error(serializer)
    raw_symbol = serializer.validated_data["symbol"]
    quantity = serializer.validated_data["quantity"]

    symbol, _ = resolve_symbol(raw_symbol, serializer.validated_data["exchange"])
    price = get_stock_price(symbol)  # network call kept outside the DB transaction
    if not price:
        return _error(f"Invalid symbol: {raw_symbol}")

    total_cost = price * quantity

    with transaction.atomic():
        wallet = Wallet.objects.select_for_update().filter(user=request.user).first()
        if wallet is None:
            wallet = Wallet.objects.create(user=request.user, amount=Wallet.STARTING_BALANCE)
        if wallet.amount < total_cost:
            return _error(f"Insufficient funds. Need ₹{total_cost:,.2f}")

        stock = Stock.objects.filter(symbol=symbol).first() or Stock.objects.create(symbol=symbol)
        portfolio, _ = Portfolio.objects.select_for_update().get_or_create(user=request.user, stock=stock)

        wallet.amount -= total_cost
        wallet.save()

        invested = portfolio.quantity * portfolio.avg_price
        portfolio.quantity += quantity
        portfolio.avg_price = (invested + total_cost) / portfolio.quantity
        portfolio.save()

        Transaction.objects.create(
            user=request.user, stock=stock, transaction_type="BUY", quantity=quantity, price=price
        )

    return Response({"message": "Buy successful", "symbol": symbol, "quantity": quantity, "price": price})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sell_stock(request):
    serializer = TradeSerializer(data=request.data)
    if not serializer.is_valid():
        return _validation_error(serializer)
    quantity = serializer.validated_data["quantity"]

    symbol, _ = resolve_symbol(serializer.validated_data["symbol"], serializer.validated_data["exchange"])
    stock = Stock.objects.filter(symbol=symbol).first()
    if stock is None or not Portfolio.objects.filter(user=request.user, stock=stock, quantity__gt=0).exists():
        return _error(f"You don't own any shares of {symbol}.")

    price = get_stock_price(symbol)  # network call kept outside the DB transaction
    if not price:
        return _error("Could not fetch price.")

    with transaction.atomic():
        portfolio = Portfolio.objects.select_for_update().filter(user=request.user, stock=stock).first()
        if portfolio is None or quantity > portfolio.quantity:
            owned = portfolio.quantity if portfolio else 0
            return _error(f"You only own {owned} share(s).")

        wallet = Wallet.objects.select_for_update().filter(user=request.user).first()
        if wallet is None:
            wallet = Wallet.objects.create(user=request.user, amount=Wallet.STARTING_BALANCE)

        wallet.amount += price * quantity
        wallet.save()

        portfolio.quantity -= quantity
        if portfolio.quantity == 0:
            portfolio.delete()
        else:
            portfolio.save()

        Transaction.objects.create(
            user=request.user, stock=stock, transaction_type="SELL", quantity=quantity, price=price
        )

    return Response({"message": "Sell successful", "symbol": symbol, "quantity": quantity, "price": price})
