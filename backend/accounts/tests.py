from django.urls import reverse
from rest_framework.test import APITestCase

from stocks.models import Wallet

from .models import User


class AuthApiTests(APITestCase):
    def register(self, **overrides):
        payload = {
            "username": "alice",
            "email": "alice@example.com",
            "password": "s3cure-Passw0rd!",
            "confirmation": "s3cure-Passw0rd!",
            **overrides,
        }
        return self.client.post(reverse("accounts:register"), payload, format="json")

    def test_register_creates_user_wallet_and_tokens(self):
        res = self.register()
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["username"], "alice")
        self.assertEqual(Wallet.objects.get(user__username="alice").amount, Wallet.STARTING_BALANCE)

    def test_register_rejects_mismatched_passwords(self):
        res = self.register(confirmation="different")
        self.assertEqual(res.status_code, 400)
        self.assertIn("match", res.data["error"])
        self.assertFalse(User.objects.filter(username="alice").exists())

    def test_register_rejects_duplicate_username_case_insensitive(self):
        self.register()
        res = self.register(username="ALICE")
        self.assertEqual(res.status_code, 400)
        self.assertIn("taken", res.data["error"])

    def test_register_rejects_weak_password(self):
        res = self.register(password="123", confirmation="123")
        self.assertEqual(res.status_code, 400)

    def test_login_returns_tokens_and_user(self):
        self.register()
        res = self.client.post(
            reverse("accounts:login"),
            {"username": "alice", "password": "s3cure-Passw0rd!"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"]["username"], "alice")

    def test_login_bad_credentials(self):
        res = self.client.post(
            reverse("accounts:login"), {"username": "nobody", "password": "x"}, format="json"
        )
        self.assertEqual(res.status_code, 401)

    def test_me_requires_auth_and_returns_wallet(self):
        self.assertEqual(self.client.get(reverse("accounts:me")).status_code, 401)
        access = self.register().data["access"]
        res = self.client.get(reverse("accounts:me"), HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["wallet_balance"], Wallet.STARTING_BALANCE)

    def test_refresh_and_logout_blacklists_token(self):
        refresh = self.register().data["refresh"]
        self.assertEqual(
            self.client.post(reverse("accounts:refresh"), {"refresh": refresh}, format="json").status_code, 200
        )
        # Rotation blacklists the old token, so log in again for a clean token to log out with.
        login = self.client.post(
            reverse("accounts:login"),
            {"username": "alice", "password": "s3cure-Passw0rd!"},
            format="json",
        )
        token = login.data["refresh"]
        self.assertEqual(self.client.post(reverse("accounts:logout"), {"refresh": token}, format="json").status_code, 204)
        self.assertEqual(
            self.client.post(reverse("accounts:refresh"), {"refresh": token}, format="json").status_code, 401
        )
