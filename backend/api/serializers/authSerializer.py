from rest_framework import serializers
from ..models import User


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint validation"""

    personal_id = serializers.CharField(required=True)
    password = serializers.CharField(required=True)


class RegisterSerializer(serializers.Serializer):
    """Serializer for registration endpoint validation"""

    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    firstName = serializers.CharField(required=True)
    lastName = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'phone']
