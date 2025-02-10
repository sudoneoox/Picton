from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny


# NOTE: sample view
@api_view(["POST"])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')


    return Response({
        'message': f'Received registration for user: {username}',
        'status': 'success'
    })
