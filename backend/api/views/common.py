from django.contrib.auth import PermissionDenied
from rest_framework import permissions


class AdminRequiredMixin:
    """
    Mixin to enforce admin-only access

    Adds a convenience method to check if the current user is an admin.
    Used by views that should only be accessible to administrators.
    """

    permission_classes = [permissions.IsAdminUser]

    def check_admin(self, request):
        """Raise Error if a non admin is trying to access an admin only resource"""
        if not request.user.is_superuser:
            raise PermissionDenied("Only administrators can access this endpoint")
