from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from your_app.views import dashboard_view

urlpatterns = [
    path("api/", include("api.urls")),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('admin/', admin.site.urls)

] 
