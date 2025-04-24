from rest_framework import serializers
from ..models import User


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for admin dashboard with additional fields

    Provides all user fields needed for admin operations.
    Used in the admin dashboard for user management.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_of_birth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
