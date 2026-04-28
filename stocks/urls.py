from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("buy/", views.buy_stock, name="buy"),
    path("sell/", views.sell_stock, name="sell"),
    path("portfolio/", views.portfolio_view, name="portfolio"),
    path("transaction/", views.transaction_view, name="transaction"),
]