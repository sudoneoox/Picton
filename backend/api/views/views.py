from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import logout


def dashboard_view(request):
    return HttpResponse("Student Dashboard - Welcome!")

def login_view(request):
    return HttpResponse("Login page placeholder")

def register_view(request):
    return HttpResponse("Register page placeholder")

def logout_view(request):
    logout(request)
    return redirect('login')  # Assumes you have a URL named 'login'