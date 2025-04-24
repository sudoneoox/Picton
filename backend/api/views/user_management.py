from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from django.conf import settings

from utils import MethodNameMixin, pretty_print
from api.serializers import UserDetailSerializer, UserSerializer
from api.models import User
from api.core import IsAdminOrSelf, IsActiveUser

from typing import List


class UserManagementViewSet(viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for basic user CRUD operations
    Some actions require admin privileges
    """

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return UserDetailSerializer
        return UserSerializer

    @action(detail=False, methods=["GET"])
    def me(self, request):
        """
        Get current user's profile

        Returns detailed information about the authenticated user.
        This endpoint is used for initializing user data in the frontend.
        """
        pretty_print(
            f"Received Request from {self._get_method_name()}: {request}", "DEBUG"
        )

        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)

    def get_permissions(self) -> List:
        """
        Override to set custom permissions per action:

            - List/Retrieve: Authenticated users
            - Create: Anyone
            - Update/Delete: Admin only
        """
        if self.action in ["create"]:
            permission_classes = [AllowAny]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [IsAdminUser, IsAdminOrSelf]
        elif self.action in ["me"]:
            permission_classes = [IsAuthenticated, IsActiveUser]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
