from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.urls import reverse

from .models import Stock, Portfolio, Transaction, Wallet, SearchHistory
from .util import get_stock_price, get_stock_info, resolve_symbol
 
# ==============================================================================
# HomePage
# ==============================================================================
 
def index(request):
    if not request.user.is_authenticated:
        return redirect("accounts:login")
 
    wallet = get_object_or_404(Wallet, user=request.user)
    portfolios = Portfolio.objects.filter(user=request.user).select_related("stock")
 
    total_portfolio_value = 0
    for p in portfolios:
        price = get_stock_price(p.stock.symbol)
        if price:
            total_portfolio_value += price * p.quantity
 
    recent_transactions = (
        Transaction.objects
        .filter(user=request.user)
        .select_related("stock")
        .order_by("-created_at")[:5]
    )
 
    return render(request, "stocks/index.html", {
        "wallet_balance": wallet.amount,
        "total_portfolio_value": total_portfolio_value,
        "net_worth": wallet.amount + total_portfolio_value,
        "recent_transactions": recent_transactions,
        "holdings_count": portfolios.count(),
    })

# ==============================================================================
# CRUD Operations on stocks.
# ==============================================================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buy_stock(request):
    raw_symbol = request.data.get("symbol", "").upper().strip()
    quantity   = int(request.data.get("quantity"))
    exchange   = request.data.get("exchange", "NSE")

    symbol, _  = resolve_symbol(raw_symbol, exchange)
    price      = get_stock_price(symbol)

    if not price:
        return Response({"error": f"Invalid symbol: {raw_symbol}"}, status=400)

    stock, _     = Stock.objects.get_or_create(symbol=symbol)
    portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)

    wallet       = get_object_or_404(Wallet, user=request.user)
    total_cost   = price * quantity

    if wallet.amount < total_cost:
        return Response({"error": f"Insufficient funds. Need ₹{total_cost:,.2f}"}, status=400)

    wallet.amount -= total_cost
    wallet.save()

    current_total        = portfolio.quantity * portfolio.avg_price
    portfolio.quantity  += quantity
    portfolio.avg_price  = (current_total + total_cost) / portfolio.quantity
    portfolio.save()

    Transaction.objects.create(
        user=request.user, 
        stock=stock,
        transaction_type='BUY', 
        quantity=quantity, 
        price=price
    )
    return Response({"message": "Buy successful", "symbol": symbol, "quantity": quantity, "price": price})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sell_stock(request):
    raw_symbol = request.data.get("symbol", "").upper().strip()
    exchange   = request.data.get("exchange", "NSE")
    quantity   = int(request.data.get("quantity"))

    symbol, _  = resolve_symbol(raw_symbol, exchange)
    stock      = get_object_or_404(Stock, symbol=symbol)
    portfolio  = get_object_or_404(Portfolio, user=request.user, stock=stock)

    if quantity > portfolio.quantity:
        return Response({"error": f"You only own {portfolio.quantity} share(s)."}, status=400)

    price = get_stock_price(symbol)
    if not price:
        return Response({"error": "Could not fetch price."}, status=400)
    
    portfolio.quantity -= quantity
    wallet = get_object_or_404(Wallet, user=request.user)
    wallet.amount += price * quantity
    wallet.save()

    if portfolio.quantity == 0:
        portfolio.delete()
    else:
        portfolio.save()

    Transaction.objects.create(
        user=request.user, 
        stock=stock,
        transaction_type='SELL', 
        quantity=quantity, 
        price=price
    )
    return Response({"message": "Sell successful", "symbol": symbol, "quantity": quantity, "price": price})

# View to show buy/sell form with pre-filled symbol and exchange
@login_required
def buysell(request):
    symbol = request.GET.get("symbol", "")
    exchange = request.GET.get("exchange", "NSE")
    mode = request.GET.get("mode", "BUY")
    return render(request, "stocks/buysell.html", {"prefill_symbol": symbol,"prefill_exchange": exchange,"prefill_mode": mode})


# ==============================================================================
# View Functions on stocks.
# ==============================================================================
@login_required
def portfolio_view(request):
    portfolios = Portfolio.objects.filter(user=request.user).select_related("stock")
 
    wallet = get_object_or_404(Wallet, user=request.user)
 
    data = []
    total_portfolio_value = 0
    for p in portfolios:
        current_price = get_stock_price(p.stock.symbol)
        total_value = current_price * p.quantity if current_price else 0
        gain_loss = (current_price - p.avg_price) * p.quantity if current_price else 0
        total_portfolio_value += total_value
        data.append({
            "symbol": p.stock.symbol,
            "quantity": p.quantity,
            "avg_price": p.avg_price,
            "current_price": current_price,
            "total_value": total_value,
            "gain_loss": gain_loss,
        })
 
    return render(request, "stocks/portfolio.html", {
        "data": data,
        "wallet_balance": wallet.amount,
        "total_portfolio_value": total_portfolio_value,
    })

# View to show transaction history 
@login_required
def transaction_view(request):
    transactions = Transaction.objects.filter(user=request.user).select_related("stock").order_by("-created_at")
    return render(request, "stocks/transactions.html", {"transactions": transactions})

# View to get stock quote information via API
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quote(request):
    symbol = request.GET.get("symbol", "").upper().strip()
    if not symbol:
        return Response({"error": "No symbol provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        info = get_stock_info(symbol)

        if not info.get("price"):
            return Response({"error": f"Could not find a price for '{symbol}'."}, status=status.HTTP_404_NOT_FOUND)

        SearchHistory.objects.update_or_create(
            user=request.user,
            symbol=info["symbol"],
            defaults={"name": info.get("name", ""), "exchange": info.get("exchange", "")}
        )
        return Response(info)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suggestions(request):
    query = request.GET.get("q", "").upper().strip()
    if not query:
        # Return user's recent 6 searches when input is empty/focused
        recent = SearchHistory.objects.filter(
            user=request.user
        ).values("symbol", "name", "exchange")[:6]
        return Response(list(recent))

    # Match against this user's history first
    results = SearchHistory.objects.filter(
        user=request.user,
        symbol__istartswith=query
    ).values("symbol", "name", "exchange")[:6]

    # If fewer than 3 personal results, pull from all users' history too
    if results.count() < 3:
        global_results = SearchHistory.objects.filter(
            symbol__istartswith=query
        ).exclude(
            user=request.user
        ).values("symbol", "name", "exchange").distinct()[:6]

        # Merge, deduplicate by symbol
        seen = {r["symbol"] for r in results}
        combined = list(results)
        for r in global_results:
            if r["symbol"] not in seen:
                combined.append(r)
                seen.add(r["symbol"])
        return Response(combined[:6])

    return Response(list(results))