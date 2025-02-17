from django.shortcuts import render, redirect
from django.conf import settings
from social_core.backends.microsoft import MicrosoftOAuth2
from social_django.utils import load_strategy, load_backend
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.auth.hashers import make_password
from .models import User
import os
from django_auth_adfs.backend import AdfsAccessTokenBackend
from django.core.exceptions import PermissionDenied
import jwt

@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    try: 
        data = request.data 
        if os.getenv('DEBUG'):
            print(f"DEBUG: received request data from registering a user {data}")

        # validate user fields
        required_fields = ['email', 'username', 'password', 'firstName', 'lastName']
        for field in required_fields:
            if not data.get(field):
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        # check if user already exists
        if User.objects.filter(email=data['email']).exists(): 
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif User.objects.filter(username=data['username']).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif data['phone'] != '':
            if User.objects.filter(phone_number=data['phone']).exists():
                return Response(
                    {'error': 'User with this phone already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # create user
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            first_name=data['firstName'],
            last_name=data['lastName'],
            phone_number=data.get('phone', '') # optional field
        )

        return Response({
            'message': 'User registered successfully',
            'user_id': user.id,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception occured inside register_user {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        if(os.getenv("DEBUG")):
            print(f"DEBUG: received request inside login_user {username} and {password}")
        if not username or not password:
            return Response(
                {'erorr': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {'error': 'Invalid Credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        login(request, user)

        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'is_superuser': user.is_superuser,
                'firstName': user.first_name,
                'lastName': user.last_name
            }
        })
    except Exception as e:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception occured inside login_user {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_users(request):
#IMPORTANT: only admin can view this
    if not request.user.is_superuser:
        return Response(
            {'error': 'Not authorized'},
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.all().values('id', 'email', 'username', 'first_name', 'last_name', 'is_active', 'is_superuser')
    return Response(users)


# NOTE: activate deactivate accounts (superuser only)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def toggle_user_status(request, user_id):
    if not request.user.is_superuser:
        return Response(
            {'error': 'Not authorized'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()

        return Response({
            'id': user.id,
            'email': user.email,
            'is_active': user.is_active
        })
    except User.DoesNotExist:
        if os.getenv("DEBUG"):
            print(f"\nDEBUG: Exception Occured inside toggle_user_status User.DoesNotExist")
        return Response(
            {'error': 'User is not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        

# NOTE: Microsoft Login
@api_view(['POST'])
@permission_classes([AllowAny])
def azure_login(request):
    try:
        if os.getenv('DEBUG'):
            print(f"DEBUG: Starting Azure login process")
            
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'No token provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token is from Azure
        unverified_token = jwt.decode(token, verify=False)
        if not unverified_token["iss"].startswith("https://sts.windows.net"):
            return Response(
                {'error': 'Invalid token issuer'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            # Authenticate using the token
            user = AdfsAccessTokenBackend().authenticate(
                request=request,
                access_token=token.encode('utf-8')
            )
            
            if user and user.is_active:
                login(request, user)
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'is_superuser': user.is_superuser,
                        'firstName': user.first_name,
                        'lastName': user.last_name
                    }
                })
            else:
                return Response(
                    {'error': 'User inactive or authentication failed'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        except PermissionDenied as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )

    except Exception as e:
        if os.getenv('DEBUG'):
            print(f"DEBUG: Exception in azure_login: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )




