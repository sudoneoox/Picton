from enum import unique
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)

ROLE_CHOICES = (
    ("student", "Student"),
    ("admin", "Admin"),
    ("staff", "Staff"),
    # add additional roles as needed
)


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
    # admin, staff, student
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="student")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Status fields
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)  # Replaces is_admin
    is_staff = models.BooleanField(default=False)  # needed for admin panel

    # signature to automatically sign forms
    signature = models.ImageField(upload_to="signatures/", null=True, blank=True)

    objects = CustomUserManager()

    # required fields for Django auth to work
    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["email"]  # username is automatically required

    def __str__(self):
        return self.username


class FormTemplate(models.Model):
    """Stores template information for different form types"""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    # store latex template content
    latex_template = models.TextField()
    # store field schema as JSON
    field_schema = models.JSONField(help_text="JSON schema defining form fields")
    # number of approvals required
    required_approvals = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class FormApprovalWorkflow(models.Model):
    """Define who needs to approve which form template"""

    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="approvals_workflows"
    )

    approver_role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    order = models.PositiveIntegerField(help_text="Order in the approval sequence")

    class Meta:
        ordering = ["order"]
        unique_together = ["form_template", "order"]

    def __str__(self):
        return f"{self.form_template.name} - {self.approver_role} (Step {self.order})"


class FormSubmission(models.Model):
    """Stores submitted form data"""

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("pending", "Pending Approval"),
        ("returned", "Returned for Changes"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="submissions"
    )
    submitter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_submissions"
    )
    form_data = models.JSONField(help_text="JSON data containing form field values")
    current_pdf = models.FileField(upload_to="form_pdfs/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    current_step = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.form_template.name} - {self.submitter.username} ({self.status})"


class FormApproval(models.Model):
    """Individual approval records for form submissions"""

    form_submission = models.ForeignKey(
        FormSubmission, on_delete=models.CASCADE, related_name="approvals"
    )
    approver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_approvals"
    )
    step_number = models.PositiveIntegerField()
    decision = models.CharField(
        max_length=20,
        choices=(
            ("approved", "Approved"),
            ("returned", "Returned for Changes"),
            ("rejected", "Rejected"),
        ),
    )
    comments = models.TextField(blank=True)
    signed_pdf = models.FileField(upload_to="signed_pdfs/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["form_submission", "approver", "step_number"]

    def __str__(self):
        return f"{self.form_submission} - {self.approver.username} ({self.decision})"
