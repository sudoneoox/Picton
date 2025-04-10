from django.db.models import OuterRef, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils import FormPDFGenerator, MethodNameMixin
from utils.prettyPrint import pretty_print

from ...core import IsActiveUser
from ...models import FormApproval, FormApprovalWorkflow, FormSubmission
from ...serializers import (
    FormApprovalSerializer,
)


class FormApprovalViewSet(viewsets.ReadOnlyModelViewSet, MethodNameMixin):
    """ViewSet for viewing form approvals"""

    serializer_class = FormApprovalSerializer
    queryset = FormApproval.objects.all()
    permission_classes = [IsAuthenticated, IsActiveUser]

    def get_queryset(self):
        """Filter approvals based on user role"""
        user = self.request.user
        queryset = super().get_queryset()

        # Admins see all approvals
        if user.is_superuser:
            return queryset

        # Users see approvals for their own submissions and approvals they made
        return queryset.filter(Q(form_submission__submitter=user) | Q(approver=user))

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """New approval endpoint"""
        approval = self.get_object()
        submission = approval.form_submission

        # Get comments from request
        comments = request.data.get("comments", "")

        # Check if user has a signature
        if not request.user.has_signature:
            return Response(
                {"error": "You need to upload a signature before approving forms"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update approval status
        approval.decision = "approved"
        approval.comments = comments
        approval.decided_at = timezone.now()  # Add timestamp for when decision was made

        # Generate signed PDF with approver's signature
        try:
            pdf_generator = FormPDFGenerator()
            signed_pdf = pdf_generator.generate_signed_form(
                submission, request.user, "approved", comments
            )

            # Save the signed PDF
            if signed_pdf:
                identifier = ""
                try:
                    identifier = submission.submission_identifier.identifier
                except:
                    identifier = f"form{submission.id}"

                template_code = (
                    "withdrawal"
                    if submission.form_template.name == "Term Withdrawal Form"
                    else "petition"
                )
                pdf_filename = f"forms/signed/{identifier}_{template_code}_approved.pdf"
                approval.signed_pdf.save(pdf_filename, signed_pdf, save=False)
                approval.signed_pdf_url = pdf_filename
        except Exception as e:
            pretty_print(f"Error generating signed PDF: {str(e)}", "ERROR")

        approval.save()

        # Move to next step
        next_step = FormApprovalWorkflow.objects.filter(
            form_template=submission.form_template, order=submission.current_step + 1
        ).first()

        if next_step:
            submission.current_step += 1
            submission.status = "pending"
            submission.save()
            # TODO: Send notification to next approver
        else:
            submission.status = "approved"
            submission.save()

        return Response({"status": submission.status})

    # Modify the reject method
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        approval = self.get_object()
        submission = approval.form_submission

        comments = request.data.get("comments", "")
        if not comments:
            return Response(
                {"error": "Comments are required when rejecting a form"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user has a signature
        if not request.user.has_signature:
            return Response(
                {"error": "You need to upload a signature before rejecting forms"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval.decision = "rejected"
        approval.comments = comments
        approval.decided_at = timezone.now()

        # Generate signed PDF with rejection reason
        try:
            pdf_generator = FormPDFGenerator()
            signed_pdf = pdf_generator.generate_signed_form(
                submission, request.user, "rejected", comments
            )

            # Save the signed PDF
            if signed_pdf:
                identifier = ""
                try:
                    identifier = submission.submission_identifier.identifier
                except:
                    identifier = f"form{submission.id}"

                template_code = (
                    "withdrawal"
                    if submission.form_template.name == "Term Withdrawal Form"
                    else "petition"
                )
                pdf_filename = f"forms/signed/{identifier}_{template_code}_rejected.pdf"
                approval.signed_pdf.save(pdf_filename, signed_pdf, save=False)
                approval.signed_pdf_url = pdf_filename
        except Exception as e:
            pretty_print(f"Error generating signed PDF: {str(e)}", "ERROR")

        approval.save()

        submission.status = "rejected"
        submission.save()

        return Response({"status": "rejected"})

    @action(detail=False, methods=["GET"])
    def pending(self, request):
        """Get all pending approvals for the current user's role"""
        user = request.user
        role = user.role

        # Only staff and admin can approve forms
        if role not in ["staff", "admin"]:
            return Response(
                {"error": "Only staff and admin users can approve forms"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Find all form submissions that are pending and current step matches this user's role
        pending_submissions = FormSubmission.objects.filter(
            status="pending",
            form_template__approvals_workflows__approver_role=role,
            current_step=FormApprovalWorkflow.objects.filter(
                form_template=OuterRef("form_template"), approver_role=role
            ).values("order")[:1],
        ).distinct()

        # Create approval entries if they don't exist yet
        for submission in pending_submissions:
            # Check if an approval entry already exists for this user and submission
            approval, created = FormApproval.objects.get_or_create(
                form_submission=submission,
                step_number=submission.current_step,
                defaults={
                    "approver": user,
                    "decision": "",  # No decision yet
                },
            )

        # Get all pending approvals that don't have a decision yet
        approvals = FormApproval.objects.filter(
            form_submission__status="pending", approver=user, decision=""
        ).select_related(
            "form_submission",
            "form_submission__form_template",
            "form_submission__submitter",
        )

        serializer = self.get_serializer(approvals, many=True)
        return Response(serializer.data)
