from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ...models import FormSubmission, FormApprovalWorkflow
from ...serializers import (
    FormSubmissionSerializer,
)
from django.db.models import OuterRef


from ...core import IsActiveUser
from utils import MethodNameMixin, pretty_print
from django.conf import settings

DEBUG = settings.DEBUG


class FormSubmissionViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """ViewSet for form submissions"""

    serializer_class = FormSubmissionSerializer
    queryset = FormSubmission.objects.all()
    permission_classes = [IsAuthenticated, IsActiveUser]

    def perform_create(self, serializer):
        # Set the submitter as the current user
        serializer.save(submitter=self.request.user)

    @action(detail=True, methods=["POST"])
    def submit(self, request, pk=None):
        """Submit a draft form for approval"""
        form_submission = self.get_object()
        pass

    @action(detail=True, methods=["POST"])
    def approve(self, request, pk=None):
        """Approve a form at the current step"""
        form_submission = self.get_object()
        pass

    @action(detail=True, methods=["POST"])
    def return_for_changes(self, request, pk=None):
        """Return a form for changes"""
        form_submission = self.get_object()

        # Similar to approve but with different logic
        # ...
        pass

    def _generate_pdf(self, form_submission):
        """Generate PDF for the form submission"""
        # TODO:
        # Implement to use LaTeX to generate PDF
        pass

    def _generate_signed_pdf(self, form_submission, approval):
        """Generate signed PDF for the approval"""
        # TODO:
        # Implement to use latex to make a signed PDF
        pass

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
