"""
URL configuration for the kbFinance API.

The backend is a pure JSON API (plus the Django admin); the UI lives in /frontend.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("stocks.urls")),
]
