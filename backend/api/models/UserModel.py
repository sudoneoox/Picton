from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from utils import signature_upload_path

from .ModelConstants import BaseModel, RoleChoices


# IMPORTANT: override default django user table
class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError("Username is required")
        if not email:
            raise ValueError("Email is required")

        extra_fields.setdefault("role", "student")
        user = self.model(
            username=username, email=self.normalize_email(email), **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault(
            "role",
            "admin",
        )
        user = self.create_user(
            username=username, email=email, password=password, **extra_fields
        )
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(BaseModel, AbstractBaseUser, PermissionsMixin):
    # Required fields
    username = models.CharField(max_length=40, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=128, default="")
    last_name = models.CharField(max_length=128, default="")

    personal_id = models.CharField(max_length=7, unique=True, null=True, blank=True)

    # Optional fields
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # User role
    # admin, staff, student
    role = models.CharField(
        max_length=30, choices=RoleChoices.choices, default=RoleChoices.STUDENT
    )

    # Status fields
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)  # Replaces is_admin
    is_staff = models.BooleanField(default=False)  # needed for admin panel

    # For future implementation notification preferences
    notification_preferences = models.JSONField(default=dict, blank=True)

    # signature to automatically sign forms
    signature = models.ImageField(
        upload_to=signature_upload_path, null=True, blank=True
    )
    has_signature = models.BooleanField(default=False)

    objects = CustomUserManager()

    # required fields for Django auth to work
    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email"]  # username is automatically required

    def save(self, *args, **kwargs):
        # Generate personal_id if not provided
        if not self.personal_id:
            self.personal_id = self._generate_unique_personal_id()
        super().save(*args, **kwargs)

    def _generate_unique_personal_id(self):
        """Generate a unique 7-digit personal ID"""
        import random

        while True:
            personal_id = str(random.randint(1000000, 9999999))
            # check if generated id is unique
            if not User.objects.filter(personal_id=personal_id).exists():
                return personal_id

    def __str__(self):
        return self.username
