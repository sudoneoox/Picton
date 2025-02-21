from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from . import views


router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path("register/", views.register_user, name="register"),  # user registration
    path("login/", views.login_user, name="login"),  # user login api endpoint
    # for microsoft authentication
    path("azure/login/", views.azure_login, name="azure_login"),
    path("azure/register/", views.azure_register, name="azure_register"),
    #DRF router endpoints
    path("", include(router.urls)),
]
