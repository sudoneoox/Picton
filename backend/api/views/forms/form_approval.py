from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from utils import MethodNameMixin

from ...core import IsActiveUser
from ...models import FormApproval, FormApprovalWorkflow
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

        # Update approval status
        approval.decision = "approved"
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

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        approval = self.get_object()
        submission = approval.form_submission

        approval.decision = "returned"
        approval.comments = request.data.get("comments", "")
        approval.save()

        submission.status = "returned"
        submission.save()

        return Response({"status": "returned"})

