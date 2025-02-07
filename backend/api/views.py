from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

# NOTE: sample view


@api_view(["GET"])
@permission_classes([AllowAny])
def same_endpointt(request):
    return Response({"message": "Hello from Django!"})
