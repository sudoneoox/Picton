from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ...models import FormApproval, FormApprovalWorkflow
from ...serializers import (
    FormApprovalSerializer,
)
from ...core import IsActiveUser

from utils import MethodNameMixin, pretty_print
from django.conf import settings
from django.db.models import Q


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

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """New approval endpoint"""
        approval = self.get_object()
        submission = approval.form_submission
        
        # Update approval status
        approval.decision = 'approved'
        approval.save()
        
        # Move to next step
        next_step = FormApprovalWorkflow.objects.filter(
            form_template=submission.form_template,
            order=submission.current_step + 1
        ).first()
        
        if next_step:
            submission.current_step += 1
            submission.status = 'pending'
            submission.save()
            # TODO: Send notification to next approver
        else:
            submission.status = 'approved'
            submission.save()
        
        return Response({'status': submission.status}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def return_for_changes(self, request, pk=None):
        """
        Return a form for changes.
        Staff can include a comment so that the student knows what to fix.
        """
        approval = self.get_object()
        submission = approval.form_submission

         # Optional: Verify that the submission is pending.
        if submission.status != 'pending':
            return Response(
                {"error": "Only pending forms can be returned for changes"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record the return decision.
        FormApproval.objects.create(
            form_submission=submission,
            approver=request.user,
            step_number=submission.current_step,
            decision="returned",
            comments=request.data.get("comments", ""),
        )

        submission.status = 'returned'
        submission.save()

        return Response(
            {'status': 'returned', 'message': 'Form returned for changes'},
            status=status.HTTP_200_OK
        )