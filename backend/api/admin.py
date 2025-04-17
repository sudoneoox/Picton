from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "is_superuser", "created_at")
    list_filter = ("is_superuser", "is_active", "created_at")
    search_fields = ("username", "email")
    ordering = ("-created_at",)

    # Fields to show in the edit form
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Personal info", {"fields": ("phone_number", "date_of_birth")}),
        ("Permissions", {"fields": ("is_active", "is_superuser")}),
    )

    # Fields to show when creating a new user
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "phone_number",
                    "date_of_birth",
                    "is_superuser",
                ),
            },
        ),
    )
