from django.shortcuts import render
from django.http import HttpResponse

def dashboard_view(request):
    return HttpResponse("Student Dashboard - Welcome!")

def login_view(request):
    return HttpResponse("Login page placeholder")

def register_view(request):
    return HttpResponse("Register page placeholder")
