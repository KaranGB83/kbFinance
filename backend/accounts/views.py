from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from stocks.models import Wallet

from .models import User
from .serializers import RegisterSerializer, UserSerializer


def _error_message(errors):
    """Flatten DRF validation errors into a single human-readable string."""
    messages = []
    for value in errors.values():
        messages.extend(value if isinstance(value, (list, tuple)) else [value])
    return " ".join(str(m) for m in messages)


class LoginSerializer(TokenObtainPairSerializer):
    """Standard JWT login, plus the user's public profile in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ -> {access, refresh, user}"""
    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class RegisterView(APIView):
    """POST /api/auth/register/ -> {access, refresh, user}. Creates the user and their wallet."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": _error_message(serializer.errors), "fields": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = serializer.validated_data
        with transaction.atomic():
            user = User.objects.create_user(data["username"], data.get("email", ""), data["password"])
            Wallet.objects.create(user=user, amount=Wallet.STARTING_BALANCE)

        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/ {refresh} -> blacklists the refresh token."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("refresh")
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass  # already expired/blacklisted - the client is logged out either way
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/ -> current user + wallet balance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = Wallet.for_user(request.user)
        return Response({**UserSerializer(request.user).data, "wallet_balance": wallet.amount})
