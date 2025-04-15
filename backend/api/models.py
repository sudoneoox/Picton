from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from utils import signature_upload_path

ROLE_CHOICES = (
    ("student", "Student"),
    ("admin", "Admin"),
    ("staff", "Staff"),
)

FORM_STATUS_CHOICES = (
    ("draft", "Draft"),
    ("pending", "Pending Approval"),
    ("returned", "Returned for Changes"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
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
    password = models.CharField(max_length=128)
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

    def __str__(self):
        return self.username


class FormTemplate(models.Model):
    """Stores template information for different form types"""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # For Future to allow admins to activate or deactivate a form template
    is_active = models.BooleanField(default=True)

    # store field schema as JSON
    field_schema = models.JSONField(help_text="JSON schema defining form fields")

    # number of approvals required
    required_approvals = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # LaTeX template path relative to templates/forms directory
    latex_template_path = models.CharField(max_length=255)

    def get_latex_template_path(self):
        """Get the full path to the LaTeX template file"""
        import os
        from django.conf import settings

        return os.path.join(
            settings.BASE_DIR, "templates", "forms", self.latex_template_path
        )

    def save(self, *args, **kwargs):
        """Ensure template path is set before saving"""
        if not self.latex_template_path:
            # Default to normalized name if not set
            self.latex_template_path = f"{self.name.lower().replace(' ', '_')}.tex"
        super().save(*args, **kwargs)

    def get_template_file_path(self):
        """Get the normalized template file path based on name"""
        if self.latex_template_path and self.latex_template_path.strip():
            return self.latex_template_path

        # Default naming convention
        template_name = self.name.lower().replace(" ", "_")
        return f"{template_name}.tex"

    def get_form_type_code(self):
        """Get a short code for the form type (useful for filenames)"""
        if "Graduate Petition" in self.name:
            return "petition"
        elif "Term Withdrawal" in self.name:
            return "withdrawal"
        else:
            # Create a short code from the name
            words = self.name.split()
            if len(words) > 1:
                return "".join(word[0].lower() for word in words)  # Acronym
            else:
                return self.name.lower().replace(" ", "_")[:10]  # First 10 chars

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


class OrganizationalUnit(models.Model):
    """Represents a unit in the organizational hierarchy"""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='sub_units')
    level = models.PositiveIntegerField(help_text="Hierarchy level (0 for top level)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    def get_hierarchy_path(self):
        """Returns the full path of units from root to this unit"""
        path = [self]
        current = self
        while current.parent:
            current = current.parent
            path.append(current)
        return list(reversed(path))

class UnitApprover(models.Model):
    """Links approvers to organizational units with specific roles"""
    unit = models.ForeignKey(OrganizationalUnit, on_delete=models.CASCADE, related_name='approvers')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='unit_approver_roles')
    role = models.CharField(max_length=50)
    is_organization_wide = models.BooleanField(default=False, help_text="Can approve across all units")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['unit', 'user', 'role']

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.unit.name}"

class ApprovalDelegation(models.Model):
    """Tracks temporary delegations of approval authority"""
    delegator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delegated_from')
    delegate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delegated_to')
    unit = models.ForeignKey(OrganizationalUnit, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    reason = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.delegator.username} -> {self.delegate.username} ({self.unit.name})"

class FormSubmission(models.Model):
    """Stores submitted form data"""

    # Form Template Used specifically their id
    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="submissions"
    )

    # Who submitted this form
    submitter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_submissions"
    )

    form_data = models.JSONField(help_text="JSON data containing form field values")

    # The Updated PDF created from the users input
    current_pdf = models.FileField(upload_to="forms/form_pdfs/", null=True, blank=True)

    # To be able to retrieve back should be created from
    # form_pdfs/{user_id}_{form_template_name}_{form_submission_id}
    pdf_url = models.TextField(null=True)

    # pending | approved | rejected | ...
    status = models.CharField(
        max_length=20, choices=FORM_STATUS_CHOICES, default="draft"
    )

    current_step = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # In order to track revision stage in case the form gets returned for changes
    version = models.PositiveIntegerField(default=1)
    previous_version = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisions",
    )

    # Add new field for organizational unit
    unit = models.ForeignKey(OrganizationalUnit, on_delete=models.CASCADE, related_name='form_submissions', null=True, blank=True)

    def __str__(self):
        return f"{self.form_template.name} - {self.submitter.username} ({self.status})"

    def generate_submission_identifier(self):
        """Generate a unique identifer for this submission"""
        from datetime import datetime
        import uuid

        # NOTE: FORMAT -> FRM-{suer_id}-{template-id}-{timestamp}-{random_suffix}
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4())[:8]

        return f"FRM-{self.submitter.id}-{self.form_template.id}-{timestamp}-{random_suffix}"


class FormApproval(models.Model):
    """Individual approval records for form submissions"""

    form_submission = models.ForeignKey(
        FormSubmission, on_delete=models.CASCADE, related_name="approvals"
    )

    # Who approved the form should have a staff or admin role
    approver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_approvals"
    )

    # Final Step Number
    step_number = models.PositiveIntegerField()

    decision = models.CharField(
        max_length=20,
        choices=(
            ("approved", "Approved"),
            ("returned", "Returned for Changes"),
            ("rejected", "Rejected"),
        ),
    )

    # In case it was Rejected
    comments = models.TextField(blank=True)

    # Track approval timing metrics
    received_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    # To track which fields were flagged for correction
    fields_to_correct = models.JSONField(null=True, blank=True)

    # Should have staff signature
    signed_pdf = models.FileField(upload_to="forms/signed_pdfs/", null=True, blank=True)

    # to quickly locate should be similiar to
    # {approver_id}_{form_type}_{approval_id}
    signed_pdf_url = models.TextField(null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    # Add delegation tracking
    delegated_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='delegated_approvals'
    )

    class Meta:
        unique_together = ["form_submission", "approver", "step_number"]

    def __str__(self):
        return f"{self.form_submission} - {self.approver.username} ({self.decision})"


class FormSubmissionIdentifier(models.Model):
    """Lookup Table for student from submissions with unique identifiers"""

    # unique identifier for form_submission
    identifier = models.CharField(max_length=50, unique=True)

    # Link to actual submission
    form_submission = models.OneToOneField(
        FormSubmission, on_delete=models.CASCADE, related_name="submission_identifier"
    )

    # metedata to quickly filter
    form_type = models.CharField(max_length=100)
    student_id = models.CharField(max_length=50, blank=True)
    submission_date = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.identifier} - {self.form_type}"

    class Meta:
        indexes = [
            models.Index(fields=["identifier"]),
            models.Index(fields=["student_id"]),
        ]
