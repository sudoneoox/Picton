from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom User model.
    Defines which fields are exposed via the API.
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
            'role',
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]