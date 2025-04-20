from django.db import models
from django.conf import settings
import os

from .ModelConstants import RoleChoices, FormStatusChoices, BaseModel
from .OrganizationalModels import (
    OrganizationalUnit,
    ApprovalDelegation,
)
from .UserModel import User


class FormTemplate(BaseModel, models.Model):
    """Stores template information for different form types"""

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # For Future to allow admins to activate or deactivate a form template
    is_active = models.BooleanField(default=True)

    # store field schema as JSON
    field_schema = models.JSONField(help_text="JSON schema defining form fields")

    # number of approvals required
    required_approvals = models.PositiveIntegerField(default=1)

    # LaTeX template path relative to templates/forms directory
    latex_template_path = models.CharField(max_length=255)

    def get_latex_template_path(self):
        """Get the full path to the LaTeX template file"""
        return os.path.join(
            settings.BASE_DIR, "templates", "forms", self.latex_template_path
        )

    def save(self, *args, **kwargs):
        """Ensure template path is set before saving"""
        if not self.latex_template_path:
            # Default to normalized name if not set
            self.latex_template_path = f"{self.name.lower().replace(' ', '_')}.tex"
        super().save(*args, **kwargs)

        # follow default naming convention
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


class FormApprovalWorkflow(BaseModel, models.Model):
    """Define who needs to approve which form template"""

    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="approvals_workflows"
    )

    approver_role = models.CharField(max_length=30, choices=RoleChoices.choices)

    order = models.PositiveIntegerField(help_text="Order in the approval sequence")

    class Meta:
        ordering = ["order"]
        unique_together = ["form_template", "order"]

    def __str__(self):
        return f"{self.form_template.name} - {self.approver_role} (Step {self.order})"


class FormSubmission(BaseModel, models.Model):
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
        max_length=20, choices=FormStatusChoices.choices, default="draft"
    )

    current_step = models.PositiveIntegerField(default=0)

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
    unit = models.ForeignKey(
        OrganizationalUnit,
        on_delete=models.CASCADE,
        related_name="form_submissions",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Form Submission"
        verbose_name_plural = "Form Submissions"

    def __str__(self):
        return f"{self.form_template.name} - {self.submitter.username} ({self.status})"

    def generate_submission_identifier(self):
        """Generate a unique identifer for this submission"""
        import uuid
        from datetime import datetime

        # NOTE: FORMAT -> FRM-{suer_id}-{template-id}-{timestamp}-{random_suffix}
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4())[:8]

        return f"FRM-{self.submitter.id}-{self.form_template.id}-{timestamp}-{random_suffix}"


class FormApproval(BaseModel, models.Model):
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

    # Add delegation tracking
    delegated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="delegated_approvals",
    )

    class Meta:
        unique_together = ["form_submission", "approver", "step_number"]

    def __str__(self):
        return f"{self.form_submission} - {self.approver.username} ({self.decision})"

    @classmethod
    def create_or_reassign(cls, form_submission, approver, step_number):
        """
        Creates a new approval or reassigns to the correct approver based on delegations
        """
        # Check if the approver has delegated their authority
        delegate = ApprovalDelegation.get_active_delegation(
            approver, form_submission.unit
        )

        # If there's a delegation, assign to delegate instead
        actual_approver = delegate if delegate else approver

        # Create or get the approval
        approval, created = cls.objects.get_or_create(
            form_submission=form_submission,
            step_number=step_number,
            defaults={
                "approver": actual_approver,
                "delegated_by": approver if delegate else None,
            },
        )

        # If approval exists but delegation changed, update it
        if not created and delegate and approval.approver != delegate:
            approval.approver = delegate
            approval.delegated_by = approver
            approval.save()

        return approval


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
