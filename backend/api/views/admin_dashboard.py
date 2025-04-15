from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from ..serializers import AdminUserSerializer, UserSerializer
from .common import AdminRequiredMixin
from ..models import User
from utils import pretty_print, MethodNameMixin


class AdminDashboardViewSet(AdminRequiredMixin, viewsets.ModelViewSet, MethodNameMixin):
    """
    ViewSet for admin dashborad operations
    Includes user management and analytics
    """

    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["GET", "POST"])
    def users(self, request):
        """
        GET: Pagination list of all users for admin
        POST: Create a new user
        EXAMPLE pagination:
            GET /api/admin/users/?page=1&page_size=5
        """
        if request.method == "POST":
            try:
                data = request.data
                pretty_print(f"Creating new user with data: {data}", "DEBUG")

                # Validate required fields
                required_fields = ["username", "email", "role", "first_name", "last_name"]
                missing_fields = [field for field in required_fields if not data.get(field)]
                if missing_fields:
                    return Response(
                        {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Check for existing users
                if User.objects.filter(email=data["email"]).exists():
                    return Response(
                        {"error": "User with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if User.objects.filter(username=data["username"]).exists():
                    return Response(
                        {"error": "User with this username already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Create user
                user = User.objects.create(
                    username=data["username"],
                    email=data["email"],
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    role=data["role"],
                    is_active=True,
                )

                # Set password if provided
                if data.get("password"):
                    user.set_password(data["password"])
                    user.save()

                # Set admin/staff flags based on role
                if data["role"] == "admin":
                    user.is_superuser = True
                    user.is_staff = True
                elif data["role"] == "staff":
                    user.is_staff = True
                user.save()

                return Response(
                    {
                        "message": "User created successfully",
                        "user": UserSerializer(user).data,
                    },
                    status=status.HTTP_201_CREATED,
                )

            except Exception as e:
                pretty_print(f"Error creating user: {str(e)}", "ERROR")
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # GET method - list users
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))
        offset = (page - 1) * page_size

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

        pretty_print(f"Toggling User Activity Status for {user.id}", "DEBUG")

        user.is_active = not user.is_active
        user.save()
        return Response(
            {"id": user.id, "email": user.email, "is_active": user.is_active}
        )

    @action(detail=True, methods=["patch"])
    def update_user(self, request, pk=None):
        """Update user information"""
        user = self.get_object()

        pretty_print(
            f"Received Request inside {self._get_method_name()}: {request.data.items()}"
        )

        # Check if trying to update a superuser
        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can modify other superuser accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check for unique constraint violations before applying changes
        email = request.data.get("email")
        username = request.data.get("username")
        role = request.data.get("role")

        errors = {}

        if role and user.role != role:
            pretty_print(
                f"Changing {user.username}'s role from {user.role} -> {role}", "DEBUG"
            )
            # If changing to admin, set is_superuser=True
            if role == "admin":
                request.data["is_superuser"] = True
                request.data["is_staff"] = True

            # If changing to staff, set is_staff=True
            elif role == "staff":
                request.data["is_superuser"] = False
                request.data["is_staff"] = True

            # If changing to student, clear admin privileges
            elif role == "student":
                request.data["is_superuser"] = False
                request.data["is_staff"] = False

            if user.role == "admin" and role != "admin":
                pretty_print(
                    "Cannot Change and admin's role to something with lower priveleges",
                    "WARNING",
                )
                errors["role"] = ["Cannot deprivilege an admin"]

        # Check email uniqueness
        if email and email != user.email and User.objects.filter(email=email).exists():
            errors["email"] = ["This email is already taken by another user."]

        # Check username uniqueness
        if (
            username
            and username != user.username
            and User.objects.filter(username=username).exists()
        ):
            errors["username"] = ["This username is already taken by another user."]

        # If found constraint violations, return early with error messages
        if errors:
            pretty_print(f"Validation errors for user {user.id}: {errors}", "DEBUG")
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # No errors found continue
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            pretty_print(f"Updated user {user.id} with data: {request.data}", "DEBUG")
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        """Create a new user"""
        try:
            data = request.data
            pretty_print(f"Creating new user with data: {data}", "DEBUG")

            # Validate required fields
            required_fields = ["username", "email", "role", "first_name", "last_name"]
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return Response(
                    {"error": f"Missing required fields: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check for existing users
            if User.objects.filter(email=data["email"]).exists():
                return Response(
                    {"error": "User with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if User.objects.filter(username=data["username"]).exists():
                return Response(
                    {"error": "User with this username already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create user
            user = User.objects.create(
                username=data["username"],
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                role=data["role"],
                is_active=True,
            )

            # Set password if provided
            if data.get("password"):
                user.set_password(data["password"])
                user.save()

            # Set admin/staff flags based on role
            if data["role"] == "admin":
                user.is_superuser = True
                user.is_staff = True
            elif data["role"] == "staff":
                user.is_staff = True
            user.save()

            return Response(
                {
                    "message": "User created successfully",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            pretty_print(f"Error creating user: {str(e)}", "ERROR")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["delete"])
    def delete_user(self, request, pk=None):
        """Delete a user - only superusers can delete users"""
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can delete users"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()

        # Prevent deleting self
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent deleting other superusers
        if user.is_superuser and user.id != request.user.id:
            return Response(
                {"error": "Cannot delete other superuser accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        pretty_print(f"Deleting user {user.id}", "DEBUG")
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
