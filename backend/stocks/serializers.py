from rest_framework import serializers

from .models import Transaction


class TradeSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=32)
    quantity = serializers.IntegerField(min_value=1, max_value=1_000_000)
    exchange = serializers.ChoiceField(choices=["NSE", "BSE", "OTHER"], default="NSE")

    def validate_symbol(self, value):
        value = value.upper().strip()
        if not value:
            raise serializers.ValidationError("Symbol is required.")
        return value


class TransactionSerializer(serializers.ModelSerializer):
    symbol = serializers.CharField(source="stock.symbol")
    total = serializers.FloatField(read_only=True)

    class Meta:
        model = Transaction
        fields = ("id", "symbol", "transaction_type", "quantity", "price", "total", "created_at")
