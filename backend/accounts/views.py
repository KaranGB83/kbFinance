from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect 
from django.shortcuts import render
from django.urls import reverse

from stocks.models import Wallet
from .models import User

# Log in view
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("stocks:index"))
        else:
            return render(request, "accounts/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "accounts/login.html")

# Log out view
@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("stocks:index"))

# Register view
def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "accounts/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "accounts/register.html", {
                "message": "Username already taken."
            })
        login(request, user)

        try:
            Wallet.objects.create(user=user, amount=1000)
        except IntegrityError:
            return render(request, "accounts/register.html", {
                "message": "Error creating wallet for user."
            })
        return HttpResponseRedirect(reverse("stocks:index"))
    else:
        return render(request, "accounts/register.html")

@login_required
def profile(request):
    wallet, created = Wallet.objects.get_or_create(user=request.user)
    wallet_balance = wallet.amount
    return render(request, "accounts/profile.html", {
        "user": request.user,
        "wallet_balance": wallet_balance,
    })