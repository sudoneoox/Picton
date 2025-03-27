from django.contrib import admin
from django.urls import path, include
from api.views import dashboard_view, login_view, register_view, logout_view
from django.http import HttpResponse

def home_view(request):
    return HttpResponse("Welcome to the homepage!")

urlpatterns = [
    path("", home_view, name="home"),  # Now http://127.0.0.1:8000/ shows "Welcome to the homepage!"
    path("api/", include("api.urls")),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("login/", login_view, name="login"),
    path("register/", register_view, name="register"),
    path('logout/', logout_view, name='logout'),
    path("admin/", admin.site.urls),
]
