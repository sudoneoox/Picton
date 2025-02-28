from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ...models import FormApproval
from ...serializers import (
    FormApprovalSerializer,
)
from ...core import IsActiveUser

from utils import MethodNameMixin, pretty_print
from django.conf import settings
from django.db.models import Q

DEBUG = settings.DEBUG


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
