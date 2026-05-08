from django.conf import settings
from django.db import models


# models for stocks app
class Stock(models.Model):
    symbol = models.CharField(max_length=32)
    name = models.CharField(max_length=128, blank=True, default="")

    def __str__(self):
        return self.symbol

# model for user portfolio, linking user to stocks with quantity and average price
class Portfolio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    avg_price = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.stock.symbol}"

# model for user wallet to track available cash balance
class Wallet(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# model for transactions to log buy/sell activity with details
class Transaction(models.Model):
    """
    Model to log buy/sell transactions with details like stock, quantity, price, and type.
    """
    TRANSACTION_TYPES = (
        ("BUY", "Buy"),
        ("SELL", "Sell"),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    quantity = models.PositiveIntegerField()
    price = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.stock.symbol}"