from django.db import models


class FormStatusChoices(models.TextChoices):
    """
    Status options for form submissions

    Defines the possible states a form can be in during its lifecycle,
    from initial draft to final approval or rejection.
    """

    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending Approval"
    RETURNED = "returned", "Returned for Changes"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class RoleChoices(models.TextChoices):
    """
    Available user roles in the system

    Defines the possible roles users can have, which determine
    their permissions and capabilities within the system:
    - STUDENT: Regular users who submit forms
    - ADMIN: System administrators with full access
    - STAFF: Users who can approve forms but not administer the system
    """

    STUDENT = "student", "Student"
    ADMIN = "admin", "Admin"
    STAFF = "staff", "Staff"


class BaseModel(models.Model):
    """
    Abstract base model with timestamp fields

    Provides created_at and updated_at fields for all models that inherit from it.
    These fields are automatically managed by Django to track when records are
    created and modified.
    """

    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True
