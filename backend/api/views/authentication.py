from django.forms import ValidationError
from django.conf import settings
from django.contrib.auth import authenticate, login, get_user_model, logout
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError

from jwt.algorithms import RSAAlgorithm

from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotFound,
    PermissionDenied as DRFPermissionDenied,
    ValidationError as DRFValidationError,
)
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

import jwt
import json
import requests
import secrets

from utils import pretty_print, MethodNameMixin
from ..core import AccountInactiveError, InvalidCredentialsError
from ..serializers import LoginSerializer
from ..models import User
from django.conf import settings

DEBUG = settings.DEBUG
User = get_user_model()


# TODO: expand to also interchangebly accept either username or email
class LoginView(views.APIView, MethodNameMixin):
    """Handle user login with username/password"""

    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            if DEBUG:
                pretty_print(
                    f"Received Request from {self._get_method_name()}: {request}",
                    "DEBUG",
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
            request.session.save()

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
        except Exception as e:
            pretty_print(f"Login Error: {str(e)}", "ERROR")
            return Response(
                {"error": "Authentication failed"}, status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(views.APIView, MethodNameMixin):
    """Handle new user registration"""

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

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
            role="student",  # Enforce default role for registration
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

    def _get_azure_jwks(self):
        """Fetch Azure AD public keys"""
        jwks_uri = f"https://login.microsoftonline.com/{settings.AUTH_ADFS['TENANT_ID']}/discovery/v2.0/keys"
        response = requests.get(jwks_uri)
        return response.json()

    def _verify_token_signature(self, token):
        """Verify token signature using Azure public keys"""
        jwks = self._get_azure_jwks()
        header = jwt.get_unverified_header(token)
        public_key = None

        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                public_key = RSAAlgorithm.from_jwk(json.dumps(key))
                break

        if not public_key:
            raise AuthenticationFailed("Invalid token signature")

        return jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            audience=settings.AUTH_ADFS["CLIENT_ID"],
            issuer=f"https://sts.windows.net/{settings.AUTH_ADFS['TENANT_ID']}/",
        )

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

        pretty_print(
            f"Token payload from {self._get_method_name()}: {payload}", "DEBUG"
        )

        if not payload["iss"].startswith("https://sts.windows.net"):
            raise AuthenticationFailed("Invalid token issuer")

        # extract login information
        email = (
            payload.get("preferred_username")
            or payload.get("upn")
            or payload.get("email")
            or ""
        ).lower()

        if not email:
            pretty_print(f"Token payload: {payload}", "ERROR")  # Debug
            raise ValidationError("No valid email found in Microsoft token")

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
        try:
            pretty_print("Starting Azure registration process", "INFO")
            token = request.data.get("token")
            if not token:
                raise ValidationError("No Token Provided")
            pretty_print(
                f"Received Token from {self._get_method_name()}: {token[:25]}...",
                "DEBUG",
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
                role="student",
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
        except jwt.PyJWTError as e:
            pretty_print(f"JWT decode error: {str(e)}", "ERROR")
            raise AuthenticationFailed("Invalid token format")


from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_exempt)
    @action(detail=False, methods=["POST"])
    def post(self, request):
        try:
            pretty_print("LOGGING OUT USER", "INFO")

            logout(request)
            return Response(
                {"message": "Logged out successfully."}, status=status.HTTP_200_OK
            )

        except Exception as e:
            pretty_print(f"Logout Error: {str(e)}", "ERROR")
            return Response(
                {"error": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST
            )


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def csrf(self, request):
        """Get a new CSRF token"""
        return Response({"message": "CSRF cookie set"})

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def update_email(self, request):
        """Update user's email address"""
        try:
            email = request.data.get("email")
            if not email:
                raise DRFValidationError("Email is required")

            # Check if email is already taken
            if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                raise DRFValidationError("Email is already taken")

            request.user.email = email
            request.user.save()
            return Response({"message": "Email updated successfully"})

        except IntegrityError:
            raise DRFValidationError("Email is already taken")
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def update_username(self, request):
        """Update user's username"""
        try:
            username = request.data.get("username")
            if not username:
                raise DRFValidationError("Username is required")

            # Check if username is already taken
            if User.objects.filter(username=username).exclude(id=request.user.id).exists():
                raise DRFValidationError("Username is already taken")

            request.user.username = username
            request.user.save()
            return Response({"message": "Username updated successfully"})

        except IntegrityError:
            raise DRFValidationError("Username is already taken")
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def update_password(self, request):
        """Update user's password"""
        try:
            current_password = request.data.get("currentPassword")
            new_password = request.data.get("newPassword")

            if not current_password or not new_password:
                raise DRFValidationError("Current password and new password are required")

            # Verify current password
            if not check_password(current_password, request.user.password):
                raise DRFValidationError("Current password is incorrect")

            # Update password
            request.user.password = make_password(new_password)
            request.user.save()
            return Response({"message": "Password updated successfully"})

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
