from django.db import models
from django.conf import settings
import os

from utils.prettyPrint import pretty_print

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

    approval_position = models.CharField(
        max_length=100, help_text="Position title of the approver"
    )
    is_required = models.BooleanField(
        default=True, help_text="Whether this approval is required for completion"
    )

    order = models.PositiveIntegerField(
        help_text="Suggested order in the approval sequence"
    )

    class Meta:
        ordering = ["order"]
        unique_together = ["form_template", "order"]

    def __str__(self):
        return f"{self.form_template.name} - {self.approver_role} (Step {self.order})"


class FormSubmission(BaseModel, models.Model):
    """Stores submitted form data"""

    required_approval_count = models.PositiveIntegerField(
        default=0, help_text="Number of required approvals for this submission"
    )
    completed_approval_count = models.PositiveIntegerField(
        default=0, help_text="Number of completed approvals"
    )

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

    def initialize_approval_requirements(self):
        """Initialize the approval requirements based on the template"""
        required_approvals = self.form_template.approvals_workflows.filter(
            is_required=True
        )
        self.required_approval_count = required_approvals.count()
        self.save()

    def update_approval_status(self):
        """Update the form status based on approvals"""
        # Count completed required approvals
        completed_required = FormApproval.objects.filter(
            form_submission=self,
            decision__in=["approved", "rejected", "returned"],
            workflow__is_required=True,
        ).count()

        self.completed_approval_count = completed_required

        # Check if any are rejected
        has_rejection = FormApproval.objects.filter(
            form_submission=self, decision="rejected"
        ).exists()

        has_return = FormApproval.objects.filter(
            form_submission=self, decision="returned"
        ).exists()

        # Update status based on approvals
        if has_rejection:
            self.status = "rejected"
        elif has_return:
            self.status = "returned"
        elif self.completed_approval_count >= self.required_approval_count:
            self.status = "approved"
        else:
            self.status = "pending"

        self.save()


class FormApproval(BaseModel, models.Model):
    """Individual approval records for form submissions"""

    form_submission = models.ForeignKey(
        FormSubmission, on_delete=models.CASCADE, related_name="approvals"
    )

    # Who approved the form should have a staff or admin role
    approver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_approvals"
    )

    # link to the workflow that defines this approval position
    workflow = models.ForeignKey(
        FormApprovalWorkflow,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approvals",
    )

    # Final Step Number
    step_number = models.PositiveIntegerField()

    decision = models.CharField(
        max_length=20,
        choices=FormStatusChoices.choices,
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

    def save(self, *args, **kwargs):
        # call original save method
        super().save(*args, **kwargs)

        # update form submission status after saving approval
        if self.decision in FormStatusChoices.choices:
            self.form_submission.update_approval_status()

    @classmethod
    def create_or_reassign(cls, form_submission, approver, step_number):
        """
        Creates a new approval or reassigns to the correct approver based on delegations
        """
        from api.models import UnitApprover, FormApprovalWorkflow

        # Get workflow step for this submission and step number
        workflow = FormApprovalWorkflow.objects.filter(
            form_template=form_submission.form_template, order=step_number
        ).first()

        if not workflow:
            pretty_print(
                "no workflow found in create_or_reassign returning None", "WARNING"
            )
            return None

        # get unit from the form_submission
        unit = form_submission.unit
        if not unit:
            pretty_print(
                "No unit found in create_or_reassign returning None", "WARNING"
            )
            return None

        # if approver is specified, check if they have delegation
        delegate = None
        if approver:
            delegate = ApprovalDelegation.get_active_delegation(approver, unit)

        # If no specific approver, find eligible approvers based on position and unit
        eligible_approvers = []
        approver_position = workflow.approval_position

        # Find unit approvers with matching role
        if unit:
            # Check for exact unit approvers
            unit_approvers = UnitApprover.objects.filter(
                unit=unit, role=approver_position, is_active=True
            )
            eligible_approvers.extend([ua.user for ua in unit_approvers])

            # Check for organization-wide approvers
            org_approvers = UnitApprover.objects.filter(
                role=approver_position, is_active=True, is_organization_wide=True
            )
            eligible_approvers.extend([ua.user for ua in org_approvers])

        # If no eligible approvers and no specified approver, return None
        if not eligible_approvers and not approver:
            pretty_print(
                f"No eligible approvers found for position: {approver_position}",
                "WARNING",
            )
            return None

        # Use the specified approver if provided, or the first eligible approver
        actual_approver = (
            approver
            if approver
            else (eligible_approvers[0] if eligible_approvers else None)
        )

        # If no approver could be determined, return None
        if not actual_approver:
            return None

        # If there's a delegation, use the delegate instead
        if delegate:
            delegated_by = actual_approver
            actual_approver = delegate
        else:
            delegated_by = None

        # Create or get the approval
        approval, created = cls.objects.get_or_create(
            form_submission=form_submission,
            step_number=step_number,
            defaults={
                "approver": actual_approver,
                "delegated_by": delegated_by,
                "workflow": workflow,
                "decision": "",  # Ensure empty decision for new approvals
            },
        )

        # If approval exists but delegation changed, update it
        if not created and delegate and approval.approver != delegate:
            approval.approver = delegate
            approval.delegated_by = delegated_by
            approval.save()

        # If approval is new, make any additional setup needed
        if created:
            pretty_print(
                f"Created new approval for {actual_approver.username} at step {step_number}",
                "INFO",
            )

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
