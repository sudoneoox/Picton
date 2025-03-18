from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ...models import FormSubmission, FormTemplate, FormApproval, FormApprovalWorkflow
from ...serializers import FormSubmissionSerializer
from ...core import IsActiveUser

from utils import MethodNameMixin, pretty_print, FormPDFGenerator
from django.conf import settings
from django.db.models import OuterRef
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


class FormSubmissionViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """ViewSet for form submissions"""

    serializer_class = FormSubmissionSerializer
    queryset = FormSubmission.objects.all()
    permission_classes = [IsAuthenticated, IsActiveUser]

    def perform_create(self, serializer):
        # Set the submitter as the current user
        serializer.save(submitter=self.request.user)

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=["POST"])
    def preview(self, request):
        """
        Generate a preview PDF from form data without storing it to the database
        So user can preview pdf inside their dashboard
        """
        pretty_print(f"Generating form preview from {self._get_method_name()}", "INFO")
        pretty_print(f"User authenticated: {request.user.is_authenticated}", "DEBUG")
        pretty_print(f"User: {request.user.username}", "DEBUG")
        pretty_print(f"Request session: {request.session.items()}", "DEBUG")
        pretty_print(f"Got Full Request {request.data}", "INFO")

        # NOTE: The Form Type (Graduate Petition | Term Withdrawal)
        # More should be added in the future
        # Graduate Petition should have Form ID 1
        # Term Withdrawal should have Form ID 2

        form_template = request.data.get("form_template")

        # NOTE: this form_data is what were going to use to generate our pdf from the template
        # we should add error handling for this in its own class
        # different forms require different optional and required fields
        if form_template:
            form_template_id = form_template.get("form_template")
            form_data = form_template.get("form_data")
        else:
            form_template_id = None
            form_data = None

        pretty_print("Full Form Preview Request Data:", "DEBUG")
        pretty_print(f"FORM_TEMPLATE_ID: {form_template_id}", "INFO")
        pretty_print(f"FORM_DATA: {form_data}", "INFO")

        # Validate required fields
        if not form_template_id or not form_data:
            pretty_print("MISSING FORM_TEMPLATE OR FORM_DATA", "ERROR")
            return Response(
                {"error": "Missing form_template or form_data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Get the form template
            form_template = FormTemplate.objects.get(id=form_template_id)

            # Generate the PDF using util class without saving it to DB
            pdf_generator = FormPDFGenerator()

            # pass the template name so that we know which one to generate
            pdf_file = pdf_generator.generate_template_form(
                form_template.name, request.user, form_data
            )

            draft_submission, created = FormSubmission.objects.get_or_create(
                form_template=form_template,
                submitter=request.user,
                status="draft",
                defaults={"form_data": form_data},
            )

            if not created:
                draft_submission.form_data = form_data
                draft_submission.save()

            template_code = (
                "withdrawal"
                if form_template.name == "Term Withdrawal Form"
                else "petition"
            )
            pdf_filename = (
                f"forms/{request.user.id}_{template_code}_{draft_submission.id}.pdf"
            )
            draft_submission.current_pdf.save(pdf_filename, pdf_file, save=False)
            draft_submission.pdf_url = pdf_filename
            draft_submission.save()

            # read pdf content and encode
            import base64

            pdf_content = pdf_file.read()
            pdf_base_64 = base64.b64encode(pdf_content).decode("utf-8")

            # Return PDF as base64 in the response
            return Response(
                {
                    "pdf_content": pdf_base_64,
                    "filename": f"{form_template.name}_preview.pdf",
                    "draft_id": draft_submission.id,
                }
            )

        except FormTemplate.DoesNotExist:
            return Response(
                {"error": "Form template not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            pretty_print(f"Error generating preview: {str(e)}", "ERROR")
            return Response(
                {"error": f"Error generating preview: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["POST"])
    def submit(self, request, pk=None):
        """Submit a draft form for approval"""
        form_submission = self.get_object()

        # Ensure the form is in draft status
        if form_submission.status != "draft":
            return Response(
                {"error": "Only draft forms can be submitted for approval"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the form template's approval workflow
        approval_workflows = (
            form_submission.form_template.approvals_workflows.all().order_by("order")
        )

        if not approval_workflows.exists():
            # If no approval workflow, mark as approved immediately
            form_submission.status = "approved"
            form_submission.save()
            return Response(
                {"status": "approved", "message": "Form approved automatically"}
            )

        # Set form to pending approval and set current step to first approval step
        form_submission.status = "pending"
        form_submission.current_step = approval_workflows.first().order
        form_submission.save()

        pretty_print(
            f"Form {form_submission.id} submitted for approval, current step: {form_submission.current_step}",
            "INFO",
        )

        # Generate final PDF with official timestamp
        self._generate_pdf(form_submission.form_template.name, form_submission)

        return Response(
            {
                "status": "pending",
                "current_step": form_submission.current_step,
                "approver_role": approval_workflows.first().approver_role,
            }
        )

    @action(detail=True, methods=["POST"])
    def approve(self, request, pk=None):
        """Approve a form at the current step"""
        form_submission = self.get_object()

        # Ensure the form is in pending status
        if form_submission.status != "pending":
            return Response(
                {"error": "Only pending forms can be approved"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if the current user has the right role to approve at this step
        user_role = request.user.role
        current_workflow = form_submission.form_template.approvals_workflows.filter(
            order=form_submission.current_step
        ).first()

        if not current_workflow or current_workflow.approver_role != user_role:
            return Response(
                {
                    "error": "You don't have permission to approve this form at this step"
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create approval record
        approval = FormApproval.objects.create(
            form_submission=form_submission,
            approver=request.user,
            step_number=form_submission.current_step,
            decision="approved",
            comments=request.data.get("comments", ""),
        )

        # Generate signed PDF for this approval
        signed_pdf = self._generate_signed_pdf(form_submission, approval)
        approval.signed_pdf = signed_pdf
        approval.save()

        # Check if there are more steps in the workflow
        next_workflow = (
            form_submission.form_template.approvals_workflows.filter(
                order__gt=form_submission.current_step
            )
            .order_by("order")
            .first()
        )

        if next_workflow:
            # Move to next step
            form_submission.current_step = next_workflow.order
            form_submission.save()
            return Response(
                {
                    "status": "pending",
                    "current_step": form_submission.current_step,
                    "approver_role": next_workflow.approver_role,
                }
            )
        else:
            # Final approval
            form_submission.status = "approved"
            form_submission.save()
            return Response({"status": "approved", "message": "Form fully approved"})

    @action(detail=True, methods=["POST"])
    def return_for_changes(self, request, pk=None):
        """Return a form for changes"""
        form_submission = self.get_object()

        # Similar logic to approve but mark as returned
        if form_submission.status != "pending":
            return Response(
                {"error": "Only pending forms can be returned for changes"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check permissions similar to approve method
        user_role = request.user.role
        current_workflow = form_submission.form_template.approvals_workflows.filter(
            order=form_submission.current_step
        ).first()

        if not current_workflow or current_workflow.approver_role != user_role:
            return Response(
                {"error": "You don't have permission to return this form at this step"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Record return decision
        FormApproval.objects.create(
            form_submission=form_submission,
            approver=request.user,
            step_number=form_submission.current_step,
            decision="returned",
            comments=request.data.get("comments", ""),
        )

        # Update form status
        form_submission.status = "returned"
        form_submission.save()

        return Response({"status": "returned", "message": "Form returned for changes"})

    def _generate_pdf(self, template_name, form_submission):
        """Generate PDF for the form submission"""
        pretty_print(
            f"RECEIVED INSIDE _generate_pdf: {template_name} {form_submission}", "DEBUG"
        )
        try:
            pdf_generator = FormPDFGenerator()
            pdf_file = pdf_generator.generate_template_form(
                template_name,
                form_submission.submitter,
                form_submission.form_data,
            )

            # Update the form submission with the generated PDF
            form_submission.current_pdf = pdf_file
            form_submission.save()

            return pdf_file
        except Exception as e:
            pretty_print(f"Error generating PDF: {str(e)}", "ERROR")
            return None

    def _generate_signed_pdf(self, form_submission, approval):
        """Generate signed PDF for the approval"""
        # TODO: need to do this complete need to make it required for user to
        # submit their signature into their account before being able to access
        # forms sidepanel
        try:
            # WARNING: for right now just send back current pdf
            return form_submission.current_pdf
        except Exception as e:
            pretty_print(f"Error generating signed PDF: {str(e)}", "ERROR")
            return None

    def get_queryset(self):
        """Filter submissions based on user role"""
        user = self.request.user
        queryset = super().get_queryset()

        # Admins see all submissions
        if user.is_superuser:
            return queryset

        # Users see submissions they created
        if self.action == "list":
            return queryset.filter(submitter=user)

        # For approvers, include submissions they need to approve
        role_submissions = FormSubmission.objects.filter(
            status="pending",
            form_template__approval_workflows__approver_role=user.role,
            current_step=FormApprovalWorkflow.objects.filter(
                form_template=OuterRef("form_template"), approver_role=user.role
            ).values("order"),
        )

        return (queryset.filter(submitter=user) | role_submissions).distinct()
