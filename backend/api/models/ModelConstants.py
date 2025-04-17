from django.db import models


class FormStatusChoices(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending Approval"
    RETURNED = "returned", "Returned for Changes"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class RoleChoices(models.TextChoices):
    STUDENT = "student", "Student"
    ADMIN = "admin", "Admin"
    STAFF = "staff", "Staff"


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True
