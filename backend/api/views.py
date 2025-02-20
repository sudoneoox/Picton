from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from django_auth_adfs.backend import AdfsAccessTokenBackend
from django.core.exceptions import PermissionDenied
import jwt
import os
from .models import User


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = request.data
        if os.getenv("DEBUG"):
            print(f"DEBUG: received request data from registering a user {data}")

        # validate user fields
        required_fields = ["email", "username", "password", "firstName", "lastName"]
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {"error": f"{field} is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # check if user already exists
        if User.objects.filter(email=data["email"]).exists():
            return Response(
                {"error": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif User.objects.filter(username=data["username"]).exists():
            return Response(
                {"error": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif data["phone"] != "":
            if User.objects.filter(phone_number=data["phone"]).exists():
                return Response(
                    {"error": "User with this phone already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # create user
        user = User.objects.create(
            username=data["username"],
            email=data["email"],
            password=make_password(data["password"]),
            first_name=data["firstName"],
            last_name=data["lastName"],
            phone_number=data.get("phone", ""),  # optional field
        )

        return Response(
            {
                "message": "User registered successfully",
                "user_id": user.id,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception occured inside register_user {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    try:
        username = request.data.get("username")
        password = request.data.get("password")
        if os.getenv("DEBUG"):
            print(
                f"DEBUG: received request inside login_user {username} and {password}"
            )
        if not username or not password:
            return Response(
                {"erorr": "Please provide both username and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )

        login(request, user)

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "is_superuser": user.is_superuser,
                    "firstName": user.first_name,
                    "lastName": user.last_name,
                },
            }
        )
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception occured inside login_user {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_users(request):
    # IMPORTANT: only admin can view this
    if not request.user.is_superuser:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().values(
        "id",
        "email",
        "username",
        "first_name",
        "last_name",
        "is_active",
        "is_superuser",
    )
    return Response(users)


# NOTE: activate deactivate accounts (superuser only)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_user_status(request, user_id):
    if not request.user.is_superuser:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()

        return Response(
            {"id": user.id, "email": user.email, "is_active": user.is_active}
        )
    except User.DoesNotExist:
        if os.getenv("DEBUG"):
            print(
                "\nDEBUG: Exception Occured inside toggle_user_status User.DoesNotExist"
            )
        return Response(
            {"error": "User is not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def azure_register(request):
    try:
        if os.getenv("DEBUG"):
            print("DEBUG: Starting Azure registration process")

        token = request.data.get("token")
        if os.getenv("DEBUG"):
            print(f"DEBUG: received token in azure_register {token[:50]}...")
            print(f"DEBUG: Request data: {request.data}")

        if not token:
            return Response(
                {"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode token without verification to extract claims
            print("DEBUG: Attempting to decode token")
            payload = jwt.decode(
                token, options={"verify_signature": False}, algorithms=["RS256"]
            )
            print(
                f"DEBUG: Token decoded successfully, issuer: {payload.get('iss', 'unknown')}"
            )

            # Verify issuer
            if not payload["iss"].startswith("https://sts.windows.net"):
                print(f"DEBUG: Invalid issuer: {payload['iss']}")
                return Response(
                    {"error": "Invalid token issuer"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Extract user info from token
            email = payload.get("upn") or payload.get("email")
            first_name = payload.get("given_name", "")
            last_name = payload.get("family_name", "")
            print(
                f"DEBUG: Extracted email: {email}, first_name: {first_name}, last_name: {last_name}"
            )

            if not email:
                print("DEBUG: Email not found in token")
                return Response(
                    {"error": "Email not found in token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # IMPORTANT: Normalize the email to lowercase before processing
            email = email.lower()
            print(f"DEBUG: Normalized email for registration: {email}")

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                print(f"DEBUG: User with email {email} already exists")
                return Response(
                    {"error": "User with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create user with random password
            import secrets

            print("DEBUG: Creating new user")
            random_password = secrets.token_urlsafe(32)
            username = email.split("@")[0]

            # Check if username exists
            if User.objects.filter(username=username).exists():
                print(
                    f"DEBUG: Username {username} already exists, generating alternative"
                )
                username = f"{username}_{secrets.token_hex(4)}"

            user = User.objects.create_user(
                username=username,
                email=email,
                password=random_password,
                first_name=first_name,
                last_name=last_name,
            )
            print(f"DEBUG: User created successfully: {user.id}")

            return Response(
                {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except jwt.DecodeError as jwt_error:
            print(f"DEBUG: JWT decode error: {str(jwt_error)}")
            return Response(
                {"error": f"Invalid token format: {str(jwt_error)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        print(f"DEBUG: Exception in azure_register: {str(e)}")
        print(f"DEBUG: Exception type: {type(e)}")
        import traceback

        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# NOTE: Microsoft Login
@api_view(["POST"])
@permission_classes([AllowAny])
def azure_login(request):
    try:
        if os.getenv("DEBUG"):
            print("DEBUG: Starting Azure login process")

        token = request.data.get("token")
        if os.getenv("DEBUG"):
            print(f"DEBUG: received token in azure_login {token[:50]}...")
            print(f"DEBUG: Full request data: {request.data}")

        if not token:
            return Response(
                {"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Decode token without verification to extract claims
            payload = jwt.decode(
                token, options={"verify_signature": False}, algorithms=["RS256"]
            )
            print(f"DEBUG: Token payload: {payload}")

            # Verify issuer
            if not payload["iss"].startswith("https://sts.windows.net"):
                return Response(
                    {"error": "Invalid token issuer"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Extract user info from token
            email = payload.get("upn") or payload.get("email")
            print(f"DEBUG: Extracted email for login: {email}")
            print(f"DEBUG: Checking if user exists with email: {email}")

            if not email:
                return Response(
                    {"error": "Email not found in token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # IMPORTANT: NORMALIZE EMAIL
            email = email.lower()
            print(f"DEBUG: Normalized email for lookup: {email}")

            # Find the user - DO NOT create if not exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {
                        "error": "No account found with this email. Please register first."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Find the user - DO NOT create if not exists
            try:
                # Try case-insensitive lookup instead
                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    print(f"DEBUG: No user found with email {email}")
                    # List all user emails for debugging
                    all_emails = list(User.objects.values_list("email", flat=True))
                    if os.getenv("DEBUG"):
                        print(f"DEBUG: All user emails in database: {all_emails}")
                    return Response(
                        {
                            "error": "No account found with this email. Please register first."
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )
                print(f"DEBUG: Found user: {user.id}, {user.email}")
            except Exception as user_lookup_error:
                print(f"DEBUG: Error looking up user: {str(user_lookup_error)}")
                return Response(
                    {"error": f"Error looking up user: {str(user_lookup_error)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Login user if active
            if user.is_active:
                login(
                    request, user, backend="django.contrib.auth.backends.ModelBackend"
                )
                return Response(
                    {
                        "message": "Login successful",
                        "user": {
                            "id": user.id,
                            "email": user.email,
                            "is_superuser": user.is_superuser,
                            "firstName": user.first_name,
                            "lastName": user.last_name,
                        },
                    }
                )
            else:
                return Response(
                    {"error": "User account is inactive"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except jwt.DecodeError as jwt_error:
            if os.getenv("DEBUG"):
                print(f"DEBUG: JWT decode error: {str(jwt_error)}")
            return Response(
                {"error": f"Invalid token format: {str(jwt_error)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"DEBUG: Exception in azure_login: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
