from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Portfolio, SearchHistory, Stock, Transaction, Wallet

PRICE = 100.0


def fake_resolve(symbol, exchange=None):
    suffix = {"NSE": ".NS", "BSE": ".BO"}.get(exchange, "")
    return symbol + suffix, bool(suffix)


@patch("stocks.views.resolve_symbol", side_effect=fake_resolve)
@patch("stocks.views.get_stock_price", return_value=PRICE)
@patch("stocks.views.get_stock_prices", side_effect=lambda syms: {s: PRICE for s in syms})
class TradingApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("bob", password="pw")
        Wallet.objects.create(user=self.user, amount=1000)
        self.client.force_authenticate(self.user)

    def buy(self, quantity=2, symbol="TCS", exchange="NSE"):
        return self.client.post(
            reverse("stocks:buy"), {"symbol": symbol, "quantity": quantity, "exchange": exchange}, format="json"
        )

    def sell(self, quantity=1, symbol="TCS", exchange="NSE"):
        return self.client.post(
            reverse("stocks:sell"), {"symbol": symbol, "quantity": quantity, "exchange": exchange}, format="json"
        )

    def test_buy_updates_wallet_portfolio_and_transactions(self, *_):
        res = self.buy(quantity=3)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Wallet.objects.get(user=self.user).amount, 700)
        pf = Portfolio.objects.get(user=self.user)
        self.assertEqual((pf.stock.symbol, pf.quantity, pf.avg_price), ("TCS.NS", 3, PRICE))
        self.assertEqual(Transaction.objects.filter(transaction_type="BUY").count(), 1)

    def test_buy_insufficient_funds_leaves_no_side_effects(self, *_):
        res = self.buy(quantity=50)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Insufficient", res.data["error"])
        self.assertEqual(Wallet.objects.get(user=self.user).amount, 1000)
        self.assertFalse(Portfolio.objects.exists())
        self.assertFalse(Transaction.objects.exists())

    def test_buy_validates_quantity(self, *_):
        for bad in (0, -5, "abc", None):
            self.assertEqual(self.buy(quantity=bad).status_code, 400, bad)

    def test_buy_invalid_symbol(self, mock_prices, mock_price, *_):
        mock_price.return_value = None
        self.assertEqual(self.buy().status_code, 400)

    def test_sell_returns_cash_and_removes_empty_position(self, *_):
        self.buy(quantity=2)
        self.assertEqual(self.sell(quantity=1).status_code, 200)
        self.assertEqual(Portfolio.objects.get(user=self.user).quantity, 1)
        self.assertEqual(self.sell(quantity=1).status_code, 200)
        self.assertFalse(Portfolio.objects.exists())
        self.assertEqual(Wallet.objects.get(user=self.user).amount, 1000)

    def test_sell_more_than_owned_or_unowned(self, *_):
        self.assertEqual(self.sell().status_code, 400)  # never bought
        self.buy(quantity=1)
        res = self.sell(quantity=5)
        self.assertEqual(res.status_code, 400)
        self.assertIn("only own 1", res.data["error"])

    def test_dashboard_portfolio_and_transactions(self, *_):
        self.buy(quantity=2)
        dash = self.client.get(reverse("stocks:dashboard")).data
        self.assertEqual(dash["wallet_balance"], 800)
        self.assertEqual(dash["total_portfolio_value"], 200)
        self.assertEqual(dash["net_worth"], 1000)
        self.assertEqual(dash["holdings_count"], 1)
        self.assertEqual(dash["recent_transactions"][0]["symbol"], "TCS.NS")

        pf = self.client.get(reverse("stocks:portfolio")).data
        self.assertEqual(pf["holdings"][0]["gain_loss"], 0)

        txs = self.client.get(reverse("stocks:transactions")).data
        self.assertEqual(txs[0]["total"], 200)

    def test_endpoints_require_authentication(self, *_):
        self.client.force_authenticate(None)
        for name in ("dashboard", "portfolio", "transactions", "quote", "suggestions"):
            self.assertEqual(self.client.get(reverse(f"stocks:{name}")).status_code, 401, name)
        self.assertEqual(self.client.post(reverse("stocks:buy"), {}, format="json").status_code, 401)

    def test_users_cannot_see_each_others_data(self, *_):
        self.buy(quantity=1)
        other = User.objects.create_user("eve", password="pw")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(reverse("stocks:transactions")).data, [])
        self.assertEqual(self.client.get(reverse("stocks:portfolio")).data["holdings"], [])


class QuoteApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("carol", password="pw")
        self.client.force_authenticate(self.user)

    @patch("stocks.views.get_stock_info")
    def test_quote_saves_search_history(self, mock_info):
        mock_info.return_value = {
            "symbol": "INFY.NS", "name": "Infosys", "price": 1500.0,
            "currency": "INR", "exchange": "NSE", "is_indian": True,
        }
        res = self.client.get(reverse("stocks:quote"), {"symbol": "infy"})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(SearchHistory.objects.filter(user=self.user, symbol="INFY.NS").exists())

    @patch("stocks.views.get_stock_info", side_effect=RuntimeError("boom internal detail"))
    def test_quote_failure_does_not_leak_exception_text(self, _):
        res = self.client.get(reverse("stocks:quote"), {"symbol": "X"})
        self.assertEqual(res.status_code, 502)
        self.assertNotIn("boom", res.data["error"])

    def test_quote_requires_symbol(self):
        self.assertEqual(self.client.get(reverse("stocks:quote")).status_code, 400)

    def test_suggestions_recent_and_prefix(self):
        SearchHistory.objects.create(user=self.user, symbol="TCS.NS", name="TCS", exchange="NSE")
        SearchHistory.objects.create(user=self.user, symbol="INFY.NS", name="Infosys", exchange="NSE")
        self.assertEqual(len(self.client.get(reverse("stocks:suggestions")).data), 2)
        res = self.client.get(reverse("stocks:suggestions"), {"q": "tc"})
        self.assertEqual([r["symbol"] for r in res.data], ["TCS.NS"])


class HealthTests(APITestCase):
    def test_health(self):
        self.assertEqual(self.client.get(reverse("health")).json(), {"status": "ok"})
