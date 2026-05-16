from django.urls import path
from . import views

app_name = "stocks"

urlpatterns = [
    path("", views.index, name="index"),
    path("buy/", views.buy_stock, name="buy"), # API endpoints for buy/sell
    path("sell/", views.sell_stock, name="sell"), # API endpoints for buy/sell
    path("trade/", views.buysell, name="buysell"), # New view for buy/sell form
    path("portfolio/", views.portfolio_view, name="portfolio"),
    path("transactions/", views.transaction_view, name="transactions"),
    path("quote/", views.quote, name="quote"),
    path("suggestions/", views.suggestions, name="suggestions"),
]