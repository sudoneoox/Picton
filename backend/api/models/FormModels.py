from django.db import models
from utils.prettyPrint import pretty_print

from .ModelConstants import BaseModel, FormStatusChoices, RoleChoices
from .OrganizationalModels import (
    ApprovalDelegation,
    OrganizationalUnit,
)
from .UserModel import User


class FormTemplate(BaseModel, models.Model):
    """
    Stores template information for different form types
    Holds the schema and required optional fields in json format
    """

    # name of form template (Graduate Petition, ...)
    name = models.CharField(max_length=100)

    # small descriptor to show user
    description = models.TextField(blank=True)

    # in order to deactivate, activate without deleting form data
    is_active = models.BooleanField(default=True)

    # store field schema as JSON
    field_schema = models.JSONField(help_text="JSON schema defining form fields")

    # number of approvals required
    required_approvals = models.PositiveIntegerField(default=1)

    # LaTeX template path relative to templates/forms directory
    latex_template_path = models.CharField(max_length=255)

    def save(self, *args, **kwargs):
        """
        Overload default save method
        Ensure template path is set before saving
        """

        if not self.latex_template_path:
            # Default to normalized name if not set
            self.latex_template_path = f"{self.name.lower().replace(' ', '_')}.tex"
        super().save(*args, **kwargs)

    def get_form_type_code(self):
        """
        Get a short code for the form type (used for filenames)

        Returns a code based on the form name:
        - For Graduate Petition forms: "petition"
        - For Term Withdrawal forms: "withdrawal"
        - For other forms: acronym or shortened name
        """

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
    """
    Define who needs to approve which form template

    Establishes the required approval sequence for each form template,
    including which roles must approve and in what order.
    """

    # FK linking to the form
    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="approvals_workflows"
    )

    # the approvers role (staff, admin)
    approver_role = models.CharField(max_length=30, choices=RoleChoices.choices)

    # the approvers position (Graduate Advisor, Department Chair ...)
    approval_position = models.CharField(
        max_length=100, help_text="Position title of the approver"
    )

    # whether the approval is optional or not
    is_required = models.BooleanField(
        default=True, help_text="Whether this approval is required for completion"
    )

    # The order in which the approvers need to sign
    order = models.PositiveIntegerField(
        help_text="Suggested order in the approval sequence"
    )

    class Meta:
        ordering = ["order"]
        unique_together = ["form_template", "order"]

    def __str__(self):
        return f"{self.form_template.name} - {self.approver_role} (Step {self.order})"


class FormSubmission(BaseModel, models.Model):
    """
    Stores submitted form data

    Tracks the entire lifecycle of a form from draft to final approval,
    including all associated data, approvals, and generated PDFs.
    """

    # required approval counts of the form needed to mark it as approved
    required_approval_count = models.PositiveIntegerField(
        default=0, help_text="Number of required approvals for this submission"
    )

    # the current approval count
    completed_approval_count = models.PositiveIntegerField(
        default=0, help_text="Number of completed approvals"
    )

    # Form Template Used
    form_template = models.ForeignKey(
        FormTemplate, on_delete=models.CASCADE, related_name="submissions"
    )

    # Who submitted this form
    submitter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_submissions"
    )

    # the form data submitted by the frontend form held as JSON
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

    # the current step where the pdf is at
    current_step = models.PositiveIntegerField(default=0)

    # In order to track revision stage in case the form gets returned for changes
    version = models.PositiveIntegerField(default=1)

    # FK linking to itself so that you can sort of get like a timeline view?
    previous_version = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisions",
    )

    # FK linking the orgnizational unit the form is for
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
        """
        Generate a unique identifier for this submission
        IMPORTANT: USED TO KEEP THE FILE NAMES UNIQUE

        Creates a formatted identifier using user ID, template ID, timestamp,
        and a random suffix to ensure uniqueness while being somewhat readable.
        Format: FRM-{user_id}-{template-id}-{timestamp}-{random_suffix}

        Returns:
            String: The generated unique identifier
        """

        import uuid
        from datetime import datetime

        # NOTE: FORMAT -> FRM-{suer_id}-{template-id}-{timestamp}-{random_suffix}
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4())[:8]

        return f"FRM-{self.submitter.id}-{self.form_template.id}-{timestamp}-{random_suffix}"

    def update_approval_status(self):
        """
        Update the form status based on completed approvals
        Used on save method

        Counts completed approvals and updates the form status to
        approved, rejected, or returned based on approval decisions.
        Called automatically when approvals are saved.
        """
        # Count completed required approvals
        completed_required = FormApproval.objects.filter(
            form_submission=self,
            decision__in=["approved", "rejected", "returned"],
            workflow__is_required=True,
        ).count()

        self.completed_approval_count = completed_required

        # Check if any are rejected
        # if any are rejected its instanly marked as rejected
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

    # FK linking to form
    form_submission = models.ForeignKey(
        FormSubmission, on_delete=models.CASCADE, related_name="approvals"
    )

    # FK Who approved the form should have a staff or admin role
    approver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="form_approvals"
    )

    # FK link to the workflow that defines this approval position
    workflow = models.ForeignKey(
        FormApprovalWorkflow,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approvals",
    )

    # Final Step Number
    step_number = models.PositiveIntegerField()

    # the decision (approved, returned, etc)
    decision = models.CharField(
        max_length=20,
        choices=FormStatusChoices.choices,
    )

    # In case it was Rejected
    comments = models.TextField(blank=True)

    received_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    # Fk linking to staff signature
    signed_pdf = models.FileField(upload_to="forms/signed_pdfs/", null=True, blank=True)

    # to quickly locate should be similiar to
    # {approver_id}_{form_type}_{approval_id}
    signed_pdf_url = models.TextField(null=True)

    # FK to Add delegation tracking
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

        Args:
            form_submission: The form submission requiring approval
            approver: Optional specific approver (can be None to auto-determine)
            step_number: Current approval workflow step number

        Returns:
            FormApproval object or None if no eligible approver found
        """
        from api.models import FormApprovalWorkflow, UnitApprover

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
    """
    Lookup Table for student form submissions with unique identifiers

    Creates a friendly identifier for forms that can be used to lookup
    submissions without exposing internal IDs. Also provides quick filtering
    by form type and student ID.
    """

    # unique identifier for form_submission
    identifier = models.CharField(max_length=50, unique=True)

    # Link to actual submission
    form_submission = models.OneToOneField(
        FormSubmission, on_delete=models.CASCADE, related_name="submission_identifier"
    )

    # metadata to quickly filter
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
