from rest_framework.decorators import action, api_view, permission_classes
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    PermissionDenied as DRFPermissionDenied,
    NotFound,
    APIException,
)
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
import jwt
import os
import secrets

from .models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides the standard CRUD actions for User management.
    Only admin users can access these endpoints.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=["PATCH"], permission_classes=[permissions.IsAdminUser])
    def set_status(self, request, pk=None):
        """
        Custom action to explicitly set the 'is_active' status of a user.
        Expects a JSON payload with {"is_active": true/false}.
        """
        user = self.get_object()
        new_status = request.data.get("is_active")
        if new_status is None:
            return Response(
                {"error": "Field 'is_active' is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Convert to boolean if provided as string
        if isinstance(new_status, str):
            if new_status.lower() in ("true", "1"):
                new_status = True
            elif new_status.lower() in ("false", "0"):
                new_status = False
            else:
                return Response(
                    {"error": "Invalid value for 'is_active'. Use true/false."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif not isinstance(new_status, bool):
            return Response(
                {"error": "Field 'is_active' must be a boolean."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = new_status
        user.save()
        return Response({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
        })

    @action(detail=True, methods=["PATCH"], permission_classes=[permissions.IsAdminUser])
    def toggle_status(self, request, pk=None):
        """
        Custom action to toggle the 'is_active' status of a user.
        Accessible only by admin users.
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
        })


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = request.data
        if os.getenv("DEBUG"):
            print(f"DEBUG: received request data for register_user: {data}")

        # Validate required fields
        required_fields = ["email", "username", "password", "firstName", "lastName"]
        for field in required_fields:
            if not data.get(field):
                raise ValidationError(f"{field} is required")

        # Check if user already exists
        if User.objects.filter(email=data["email"]).exists():
            raise ValidationError("User with this email already exists")
        if User.objects.filter(username=data["username"]).exists():
            raise ValidationError("User with this username already exists")
        if data.get("phone") and User.objects.filter(phone_number=data["phone"]).exists():
            raise ValidationError("User with this phone already exists")

        # Create user
        user = User.objects.create(
            username=data["username"],
            email=data["email"],
            password=make_password(data["password"]),
            first_name=data["firstName"],
            last_name=data["lastName"],
            phone_number=data.get("phone", ""),
            role="basicuser",  # Enforce default role for registration
        )

        return Response({
            "message": "User registered successfully",
            "user_id": user.id,
        }, status=status.HTTP_201_CREATED)

    except ValidationError as ve:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: ValidationError in register_user: {str(ve)}")
        raise ve
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception in register_user: {str(e)}")
        raise APIException(str(e))


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    try:
        username = request.data.get("username")
        password = request.data.get("password")

        if os.getenv("DEBUG"):
            print(f"DEBUG: received request in login_user: {username}, {password}")

        if not username or not password:
            raise ValidationError("Please provide both username and password")

        user = authenticate(username=username, password=password)
        if not user:
            raise AuthenticationFailed("Invalid Credentials")

        login(request, user)

        return Response({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "is_superuser": user.is_superuser,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
        })
    except (ValidationError, AuthenticationFailed) as ve:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Authentication error in login_user: {str(ve)}")
        raise ve
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception in login_user: {str(e)}")
        raise APIException(str(e))


@api_view(["POST"])
@permission_classes([AllowAny])
def azure_register(request):
    try:
        if os.getenv("DEBUG"):
            print("DEBUG: Starting Azure registration process")

        token = request.data.get("token")
        if os.getenv("DEBUG"):
            print(f"DEBUG: received token in azure_register: {token[:50]}...")

        if not token:
            raise ValidationError("No token provided")

        # Decode token without verification to extract claims
        payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["RS256"])
        if os.getenv("DEBUG"):
            print(f"DEBUG: Token decoded, issuer: {payload.get('iss', 'unknown')}")

        if not payload["iss"].startswith("https://sts.windows.net"):
            raise AuthenticationFailed("Invalid token issuer")

        email = (payload.get("upn") or payload.get("email") or "").lower()
        first_name = payload.get("given_name", "")
        last_name = payload.get("family_name", "")

        if not email:
            raise ValidationError("Email not found in token")

        if User.objects.filter(email=email).exists():
            raise ValidationError("User with this email already exists")

        random_password = secrets.token_urlsafe(32)
        username = email.split("@")[0]
        if User.objects.filter(username=username).exists():
            username = f"{username}_{secrets.token_hex(4)}"

        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password,
            first_name=first_name,
            last_name=last_name,
            role="basicuser",  # Enforce default role
        )
        if os.getenv("DEBUG"):
            print(f"DEBUG: Azure user created successfully: {user.id}")

        return Response({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "role": user.role,
            },
        }, status=status.HTTP_201_CREATED)

    except jwt.DecodeError:
        raise ValidationError("Invalid token format.")
    except (ValidationError, AuthenticationFailed) as ve:
        if os.getenv("DEBUG"):
            print(f"DEBUG: Azure register error: {str(ve)}")
        raise ve
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"DEBUG: Exception in azure_register: {str(e)}")
        raise APIException(str(e))


@api_view(["POST"])
@permission_classes([AllowAny])
def azure_login(request):
    try:
        if os.getenv("DEBUG"):
            print("DEBUG: Starting Azure login process")

        token = request.data.get("token")
        if os.getenv("DEBUG"):
            print(f"DEBUG: received token in azure_login: {token[:50]}...")

        if not token:
            raise ValidationError("No token provided")

        payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["RS256"])
        if os.getenv("DEBUG"):
            print(f"DEBUG: Token payload: {payload}")

        if not payload["iss"].startswith("https://sts.windows.net"):
            raise AuthenticationFailed("Invalid token issuer")

        email = (payload.get("upn") or payload.get("email") or "").lower()
        if not email:
            raise ValidationError("Email not found in token")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise NotFound("No account found with this email. Please register first.")

        if user.is_active:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "is_superuser": user.is_superuser,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "role": user.role,
                },
            })
        else:
            raise DRFPermissionDenied("User account is inactive")

    except jwt.DecodeError:
        raise ValidationError("Invalid token format.")
    except (ValidationError, AuthenticationFailed, NotFound, DRFPermissionDenied) as ve:
        if os.getenv("DEBUG"):
            print(f"DEBUG: Azure login error: {str(ve)}")
        raise ve
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"DEBUG: Exception in azure_login: {str(e)}")
        raise APIException(str(e))
