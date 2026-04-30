from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
 
from .models import Stock, Portfolio, Transaction, Wallet
from .util import get_stock_price, get_stock_info
 
 
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
        symbol = request.POST.get("symbol")
        quantity = int(request.POST.get("quantity"))

        price = get_stock_price(symbol)

        if not price:
            return render(request, "stocks/buy.html", {"message": "Invalid Stock"})
        
        stock, _ = Stock.objects.get_or_create(symbol=symbol) 
        portfolio, created = Portfolio.objects.get_or_create(user=request.user, stock=stock)

        wallet = get_object_or_404(Wallet, user=request.user)
        total_cost = price * quantity

        if wallet.amount < total_cost:
            return render(request, "stocks/buy.html", {"message": "Insufficient Funds"})

        wallet.amount -= total_cost
        wallet.save()

        current_total_cost = portfolio.quantity * portfolio.avg_price
        new_cost = current_total_cost + total_cost

        portfolio.quantity += quantity
        portfolio.avg_price = new_cost / portfolio.quantity
        portfolio.save()

        Transaction.objects.create(
            user = request.user,
            stock = stock,
            transaction_type = 'BUY',
            quantity= quantity,
            price = price
        )

        return redirect("stocks:portfolio")
    
    return render(request, "stocks/buy.html")

@login_required
def sell_stock(request):
    if request.method == "POST":
        symbol = request.POST.get("symbol").upper().strip()
        quantity = int(request.POST.get("quantity"))
 
        stock = get_object_or_404(Stock, symbol=symbol)
        portfolio = get_object_or_404(Portfolio, user=request.user, stock=stock)
 
        if quantity > portfolio.quantity:
            return render(request, "stocks/sell.html", {"message": f"You only own {portfolio.quantity} share(s) of {symbol}."})
        
        price = get_stock_price(symbol)
        if not price:
            return render(request, "stocks/sell.html", {"message": "Could not fetch stock price. Please try again."})
        
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
    
    return render(request, "stocks/sell.html")

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

