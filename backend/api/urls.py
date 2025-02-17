from django.urls import path, include
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'), # user registration
    path('login/', views.login_user, name='login'),     # user login api endpoint
    path('users/', views.get_users, name='get_users'),  # For admin panel
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
]
