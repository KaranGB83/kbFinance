from django.urls import path

from . import views

app_name = "stocks"

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("portfolio/", views.portfolio_view, name="portfolio"),
    path("transactions/", views.transaction_view, name="transactions"),
    path("quote/", views.quote, name="quote"),
    path("suggestions/", views.suggestions, name="suggestions"),
    path("buy/", views.buy_stock, name="buy"),
    path("sell/", views.sell_stock, name="sell"),
]
