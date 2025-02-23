from rest_framework import permissions


class IsAdminOrSelf(permissions.BasePermission):
    """Allow users to edit their own profiles"""

    def has_object_permission(self, request, view, obj):
        # allow admin full access
        if request.user.is_superuser:
            return True
        # only allow for other users to edit their own profile
        return obj.id == request.user.id


class IsActiveUser(permissions.BasePermission):
    """Only allolw active users to access the API"""

    def has_permission(self, request, view):
        return request.user and request.user.is_active
