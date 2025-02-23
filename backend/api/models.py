from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

ROLE_CHOICES = (
    ("basicuser", "Basic User"),
    ("admin", "Admin"),
    # add additional roles as needed
)


# IMPORTANT: override default django user table
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        if not email:
            raise ValueError("Email is required")

        extra_fields.setdefault("role", "basicuser")
        user = self.model(
            username=username, email=self.normalize_email(email), **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        user = self.create_user(
            username=username, email=email, password=password, **extra_fields
        )
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    # Required fields
    username = models.CharField(max_length=40, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Django handles this
    first_name = models.CharField(max_length=128, default="")
    last_name = models.CharField(max_length=128, default="")

    # Optional fields
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # User role
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="basicuser")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Status fields
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)  # Replaces is_admin
    is_staff = models.BooleanField(default=False)  # needed for admin panel

    objects = CustomUserManager()

    # required fields for Django auth to work
    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email"]  # username is automatically required

    def __str__(self):
        return self.username
