from django.db.models import OuterRef, Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils import FormPDFGenerator, MethodNameMixin
from utils.prettyPrint import pretty_print

from api.core import IsActiveUser
from api.models import (
    ApprovalDelegation,
    FormApproval,
    FormApprovalWorkflow,
    FormSubmission,
    UnitApprover,
)
from api.serializers import FormApprovalSerializer, FormApprovalWorkflowSerializer


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

            # Map approver position to signature placeholder
            position_map = {
                "Graduate Studies/Program Director": "PROGRAM_DIRECTOR",
                "Department Chair": "DEPT_CHAIR",
                "Associate/Assistant Dean for Graduate Studies": "ASSOC_DEAN",
                "Vice Provost/Dean of the Graduate School": "VICE_PROVOST",
            }

            position = (
                approval.workflow.approval_position if approval.workflow else None
            )
            signature_key = position_map.get(position, "STAFF")

            pretty_print(
                f"Signing as position {position} (key: {signature_key})", "DEBUG"
            )

            signed_pdf = pdf_generator.generate_signed_form(
                submission,
                request.user,
                "approved",
                comments,
                signature_position=signature_key,
            )

            # Save the signed PDF
            if signed_pdf:
                identifier = ""
                try:
                    identifier = submission.submission_identifier.identifier
                except:
                    identifier = f"form{submission.id}"

                template_code = submission.form_template.get_form_type_code()
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
            # Create the next approval record
            FormApproval.create_or_reassign(submission, None, submission.current_step)
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
                    pdf_filename = (
                        f"forms/signed/{identifier}_{template_code}_rejected.pdf"
                    )
                    approval.signed_pdf.save(pdf_filename, signed_pdf, save=False)
                    approval.signed_pdf_url = pdf_filename

            except Exception as e:
                pretty_print(
                    f"Error generating signed PDF in FormApproval.ViewSet.reject: {str(e)}",
                    "ERROR",
                )

            approval.save()

            submission.status = "rejected"
            submission.save()

            return Response({"status": "rejected"})

    @action(detail=False, methods=["GET"])
    def pending(self, request):
        """Get all pending approvals for the current user's role including delegated ones"""
        user = request.user
        role = user.role

        # Only staff and admin can approve forms
        if role not in ["staff", "admin"]:
            return Response(
                {"error": "Only staff and admin users can approve forms"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get units where user is an approver
        user_approver_positions = UnitApprover.objects.filter(user=user, is_active=True)
        user_units = UnitApprover.objects.filter(user=user, is_active=True).values_list(
            "unit", flat=True
        )

        # Get units delegated to this user
        now = timezone.now()
        delegated_units = ApprovalDelegation.objects.filter(
            delegate=user, is_active=True, start_date__lte=now, end_date__gte=now
        ).values_list("unit", flat=True)

        # Combine user's units with delegated units
        all_units = list(user_units) + list(delegated_units)

        # Find submissions in user's units or where user is organization-wide approver
        is_org_wide_approver = UnitApprover.objects.filter(
            user=user, is_organization_wide=True, is_active=True
        ).exists()

        # Find all form submissions that are pending and match this user's units
        pending_submissions_query = FormSubmission.objects.filter(status="pending")

        if not user.is_superuser and not is_org_wide_approver:
            pending_submissions_query = pending_submissions_query.filter(
                unit__in=all_units
            )

        # Match current step with workflow
        pending_submissions = pending_submissions_query.filter(
            form_template__approvals_workflows__approver_role=role,
            current_step=FormApprovalWorkflow.objects.filter(
                form_template=OuterRef("form_template"), approver_role=role
            ).values("order")[:1],
        ).distinct()

        # Create or update approval entries
        for submission in pending_submissions:
            # Use the new method to handle delegations
            FormApproval.create_or_reassign(submission, user, submission.current_step)
        # Get all pending approvals assigned to this user or delegated to this user
        approvals = FormApproval.objects.filter(
            form_submission__status="pending", approver=user, decision=""
        ).select_related(
            "form_submission",
            "form_submission__form_template",
            "form_submission__submitter",
            "workflow",
        )

        # Serialize with custom method to include unit role information
        serializer = self.get_serializer(approvals, many=True)

        # Add unit role information to each approval
        response_data = serializer.data
        for i, approval in enumerate(approvals):
            # Find the specific unit approver role for this user in this unit
            unit = approval.form_submission.unit
            if unit:
                unit_approver = UnitApprover.objects.filter(
                    user=user, unit=unit, is_active=True
                ).first()

                if unit_approver:
                    response_data[i]["unit_role"] = unit_approver.role
                    response_data[i]["unit_name"] = unit.name

        return Response(response_data)
