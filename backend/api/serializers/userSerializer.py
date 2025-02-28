from rest_framework import serializers
from ..models import User


class UserSerializer(serializers.ModelSerializer):
    """Basic User Serializer with limited fields"""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "signature",
            "role",
        ]
        read_only_fields = ["id"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with all fields"""

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
            "created_at",
            "updated_at",
            "is_superuser",
            "signature",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
