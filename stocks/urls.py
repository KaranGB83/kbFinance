from django.urls import path
from . import views

app_name = "stocks"

urlpatterns = [
    path("", views.index, name="index"),
    path("buy/", views.buy_stock, name="buy"),
    path("sell/", views.sell_stock, name="sell"),
    path("trade/", views.buysell, name="buysell"),
    path("portfolio/", views.portfolio_view, name="portfolio"),
    path("transactions/", views.transaction_view, name="transactions"),
    path("quote/", views.quote, name="quote"),
]