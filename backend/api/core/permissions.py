from rest_framework import permissions


class IsAdminOrSelf(permissions.BasePermission):
    """
    Allow users to edit their own profiles or admins to edit any profile

    This permission class is used for user management endpoints to ensure
    users can only modify their own data unless they have admin privileges.
    """

    def has_object_permission(self, request, view, obj):
        # allow admin full access
        if request.user.is_superuser:
            return True
        # only allow for other users to edit their own profile
        return obj.id == request.user.id


class IsActiveUser(permissions.BasePermission):
    """
    Only allow active users to access the API

    This permission class is used as a global check to prevent
    inactive users from using any API endpoints.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_active
