from django.forms import ValidationError
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotFound,
    PermissionDenied as DRFPermissionDenied,
)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

import jwt
import secrets

from utils import pretty_print, MethodNameMixin
from ..core import AccountInactiveError, InvalidCredentialsError
from ..serializers import LoginSerializer
from ..models import User
from django.conf import settings

DEBUG = settings.DEBUG


# TODO: expand to also interchangebly accept either username or email
class LoginView(views.APIView, MethodNameMixin):
    """Handle user login with username/password"""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if DEBUG:
            pretty_print(
                f"Received Request from {self._get_method_name()}: {request}", "DEBUG"
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            pretty_print(
                f"Error Encountered from {self._get_method_name()}: Please provide both username and password",
                "ERROR",
            )
            raise ValidationError("Please provide both username and password")

        user = authenticate(username=username, password=password)
        if not user:
            pretty_print(
                f"Error Encountered from {self._get_method_name()}: Invalid Credentials",
                "ERROR",
            )
            raise InvalidCredentialsError()

        # check if account is activated or not
        if not user.is_active:
            pretty_print(
                f"Error logging in user: {user.username} is not activated", "ERROR"
            )
            raise AccountInactiveError()

        # no errors log that user in
        login(request, user)

        # TODO: use this response in the frontend to fill up dashboard
        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "is_superuser": user.is_superuser,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "role": user.role,
                },
            }
        )


class RegisterView(views.APIView, MethodNameMixin):
    """Handle new user registration"""

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        if DEBUG:
            pretty_print(
                f"Received Request from {self._get_method_name()}: {data}", "DEBUG"
            )
        # Validate required fields
        required_fields = ["email", "username", "password", "firstName", "lastName"]
        for field in required_fields:
            if not data.get(field):
                pretty_print(
                    f"Encountered from {self._get_method_name()}: {field} is required",
                    "ERROR",
                )
                raise ValidationError(f"{field} is required")

        # Check if user already exists
        if User.objects.filter(email=data["email"]).exists():
            raise ValidationError("User with this email already exists")
            pretty_print(
                f"from {self._get_method_name()}: User with this email already exists",
                "ERROR",
            )
        if User.objects.filter(username=data["username"]).exists():
            pretty_print(
                f"from {self._get_method_name()}: User with this username already exists",
                "ERROR",
            )
            raise ValidationError("User with this username already exists")
        if (
            data.get("phone")
            and User.objects.filter(phone_number=data["phone"]).exists()
        ):
            pretty_print(
                f"from {self._get_method_name()}: User with this phone already exists",
                "ERROR",
            )

            raise ValidationError("User with this phone already exists")

        # Checks Passed Make User
        user = User.objects.create(
            username=data["username"],
            email=data["email"],
            password=make_password(data["password"]),
            first_name=data["firstName"],
            last_name=data["lastName"],
            phone_number=data.get("phone", ""),
            role="basicuser",  # Enforce default role for registration
        )

        return Response(
            {
                "message": "User registered successfully",
                "user_id": user.id,
            },
            status=status.HTTP_201_CREATED,
        )


class AzureAuthViewSet(viewsets.ViewSet, MethodNameMixin):
    """Handle Microsoft Azure authentication"""

    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"])
    def login(self, request):
        pretty_print("Starting Azure login process", "INFO")
        pretty_print(f"Received Request: {request}", "DEBUG")
        token = request.data.get("token")
        if not token:
            raise ValidationError("No Token Provided")

        payload = jwt.decode(
            token, options={"verify_signature": False}, algorithms=["RS256"]
        )

        if DEBUG:
            pretty_print(
                f"Token payload from {self._get_method_name()}: {payload}", "DEBUG"
            )

        if not payload["iss"].startswith("https://sts.windows.net"):
            raise AuthenticationFailed("Invalid token issuer")

        # extract login information
        email = (payload.get("upn") or payload.get("email") or "").lower()

        if not email:
            raise ValidationError("Email not found in token")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise NotFound("No account found with this email. Please register first.")

        # check if the user is deactivated or not
        if user.is_active:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            return Response(
                {
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "is_superuser": user.is_superuser,
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "role": user.role,
                    },
                }
            )
        else:
            raise DRFPermissionDenied("User account is inactive")

    @action(detail=False, methods=["post"])
    def register(self, request):
        pretty_print("Starting Azure registration process", "INFO")
        token = request.data.get("token")
        if not token:
            raise ValidationError("No Token Provided")
        pretty_print(
            f"Received Token from {self._get_method_name()}: {token[:25]}...", "DEBUG"
        )

        # Decode Token without verification to extract claims
        payload = jwt.decode(
            token, options={"verify_signature": False}, algorithms=["RS256"]
        )
        if DEBUG:
            pretty_print(
                f"Token Decoded, issuer: {payload.get('iss', 'unknown')}", "DEBUG"
            )
        if not payload["iss"].startswith("https://sts.windows.net"):
            raise AuthenticationFailed("Invalid token Issuer")

        # extract  details from payload
        email = (payload.get("upn") or payload.get("email") or "").lower()
        first_name = payload.get("given_name", "")
        last_name = payload.get("family_name", "")

        if not email:
            raise ValidationError("Email not found in token")
        if User.objects.filter(email=email).exists():
            raise ValidationError("User with this email already exists")

        # new user start creating and account for them
        random_password = secrets.token_urlsafe(32)
        username = email.split("@")
        # username is taken rather than giving them an error hex it
        if User.objects.filter(username=username).exists():
            username = f"{username}_{secrets.token_hex(4)}"

        # all steps completed create user
        # TODO: we dont have roles defined anymore either remove role or add to schema
        user = User.objects.create_user(
            username=username,
            email=email,
            password=random_password,
            first_name=first_name,
            last_name=last_name,
            role="basicuser",
        )
        pretty_print(f"Azure user created successfully, user_id: {user.id}", "INFO")

        return Response(
            {
                "message": "User Registered successfully!",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                    "role": user.role,
                },
            }
        )
