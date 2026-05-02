from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.urls import reverse

from .models import Stock, Portfolio, Transaction, Wallet
from .util import get_stock_price, get_stock_info
 
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
@login_required
def buy_stock(request):
    if request.method == "POST":
        symbol = request.POST.get("symbol", "").upper().strip()
        quantity = int(request.POST.get("quantity"))

        price = get_stock_price(symbol)
        if not price:
            messages.error(request, f"Invalid stock symbol: {symbol}")
            return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")

        stock, _ = Stock.objects.get_or_create(symbol=symbol)
        portfolio, _ = Portfolio.objects.get_or_create(user=request.user, stock=stock)

        wallet = get_object_or_404(Wallet, user=request.user)
        total_cost = price * quantity

        if wallet.amount < total_cost:
            messages.error(request, f"Insufficient funds. Need ₹{total_cost:,.2f}, have ₹{wallet.amount:,.2f}.")
            return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")

        wallet.amount -= total_cost
        wallet.save()

        current_total_cost = portfolio.quantity * portfolio.avg_price
        portfolio.quantity += quantity
        portfolio.avg_price = (current_total_cost + total_cost) / portfolio.quantity
        portfolio.save()

        Transaction.objects.create(
            user=request.user,
            stock=stock,
            transaction_type='BUY',
            quantity=quantity,
            price=price,
        )
        return redirect("stocks:portfolio")
    symbol = request.GET.get("symbol", "")
    return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")


@login_required
def sell_stock(request):
    if request.method == "POST":
        symbol = request.POST.get("symbol").upper().strip()
        quantity = int(request.POST.get("quantity"))
 
        stock = get_object_or_404(Stock, symbol=symbol)
        portfolio = get_object_or_404(Portfolio, user=request.user, stock=stock)
 
        if quantity > portfolio.quantity:
            messages.error(request, f"You only own {portfolio.quantity} share(s) of {symbol}.")
            return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")

        price = get_stock_price(symbol)
        if not price:
            messages.error(request, "Could not fetch stock price. Please try again.")
            return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")
        portfolio.quantity -= quantity
        wallet = get_object_or_404(Wallet, user=request.user)
        wallet.amount += price * quantity
        wallet.save()

        if portfolio.quantity == 0:
            portfolio.delete()
        else:
            portfolio.save()

        Transaction.objects.create(
            user = request.user,
            stock = stock,
            transaction_type = 'SELL',
            quantity= quantity,
            price = price
        )
        return redirect("stocks:portfolio")
    symbol = request.GET.get("symbol", "")
    return redirect(f"{reverse('stocks:buysell')}?symbol={symbol}")


@login_required
def buysell(request):
    symbol = request.GET.get("symbol", "")
    print("prefill_symbol:", symbol)
    return render(request, "stocks/buysell.html", {"prefill_symbol": symbol})


# ==============================================================================
# View Functions on stocks stocks.
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
 
@login_required
def transaction_view(request):
    transactions = Transaction.objects.filter(user=request.user).select_related("stock").order_by("-created_at")
    return render(request, "stocks/transactions.html", {"transactions": transactions})

@login_required
def quote(request):
    symbol = request.GET.get("symbol", "").upper().strip()
    if not symbol:
        return JsonResponse({"message": "No symbol Provided"}, status=400)
    
    info = get_stock_info(symbol)
    if not info["price"]:
        return JsonResponse({"error": f"Could not find a price for '{symbol}'. Check the symbol and try again."}, status=404)
 
    return JsonResponse(info)
