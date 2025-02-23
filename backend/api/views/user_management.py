from ..serializers import UserDetailSerializer, UserSerializer
from ..models import User
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response


class UserManagementViewSet(viewsets.ModelViewSet):
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
        """Get current user's profile"""
        # NOTE: /users/me/ endpoint authentication middleware

        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    def get_permissions(self):
        """
        Override to set custom permissions per action:
        - List/Retrieve: Authenticated users
        - Create: Anyone
        - Update/Delete: Admin only
        """
        if self.action in ["create"]:
            permission_classes = [AllowAny]
        elif self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAuthenticated]
        return [[permission() for permission in permission_classes]]
