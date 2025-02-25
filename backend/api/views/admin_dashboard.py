from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..serializers import AdminUserSerializer, UserSerializer
from .common import AdminRequiredMixin
from ..models import User
from utils import pretty_print, MethodNameMixin

from os import getenv

DEBUG = getenv("DEBUG")


class AdminDashboardViewSet(AdminRequiredMixin, viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for admin dashborad operations
    Includes user management and analytics
    """

    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    @action(detail=False, methods=["GET"])
    def users(self, request):
        """
        Pagination list of all users for admin
        EXAMPLE pagination:
            GET /api/admin/users/?page=1&page_size=5
        """
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))
        offset = (page - 1) * page_size

        if DEBUG:
            pretty_print(
                f"Calculated (page,page_size,offset) for {self._get_method_name()}: {page, page_size, offset}",
                "DEBUG",
            )

        total_users = User.objects.count()
        users = User.objects.all().order_by("id")[offset : offset + page_size]

        return Response(
            {
                "total": total_users,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_users + page_size - 1) // page_size,
                "results": UserSerializer(users, many=True).data,
            }
        )

    # TODO: implement chart view or stat view for frontend its going to utilize this
    @action(detail=False, methods=["get"])
    def user_stats(self, _):
        """Get user statistics for dashboard"""
        pretty_print(
            f"Getting user_stats for admin dashborad from {self._get_method_name()}",
            "INFO",
        )
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        return Response(
            {
                "total_users": total_users,
                "active_users": active_users,
                "inactive_users": total_users - active_users,
            }
        )

    def get_queryset(self):
        """Add custom filtering and ordering"""
        queryset = super().get_queryset()
        # add filters based on query params
        return queryset

    @action(detail=True, methods=["patch"])
    def toggle_status(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        # Can not deactivate account for admin
        if user.is_superuser:
            return Response(
                {"error": "Cannot change status of superuser accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # prevent deactivating self
        # note that this case is covered by the one above since
        # an admin cant deactivate an admin but this is added as extra precautions
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot change your own account status"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if DEBUG:
            pretty_print(f"Toggling User Activity Status for {user.id}", "DEBUG")

        user.is_active = not user.is_active
        user.save()
        return Response(
            {"id": user.id, "email": user.email, "is_active": user.is_active}
        )
