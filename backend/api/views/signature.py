from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from utils import pretty_print
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt


@method_decorator(csrf_exempt, name="dispatch")
class CheckSignatureView(APIView):
    """Check if user has a signature"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        pretty_print(f"Checking signature for user: {request.user.username}", "DEBUG")

        pretty_print(f"User authenticated: {request.user.is_authenticated}", "DEBUG")
        pretty_print(f"Request session: {request.session.items()}", "DEBUG")

        has_signature = request.user.has_signature
        return Response({"has_signature": has_signature})

    def get(self, request):
        return self.post(request)


@method_decorator(csrf_exempt, name="dispatch")
class SubmitSignatureView(APIView):
    """Upload user signature"""

    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        pretty_print(f"Uploading signature for user: {request.user.username}", "DEBUG")
        pretty_print(f"Request FILES: {request.FILES}", "DEBUG")
        pretty_print(f"Request data: {request.data}", "DEBUG")

        if "signature" not in request.FILES:
            return Response(
                {"error": "No signature file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = request.user
            user.signature = request.FILES["signature"]
            user.has_signature = True
            user.save()

            return Response(
                {"message": "Signature uploaded successfully", "has_signature": True}
            )
        except Exception as e:
            pretty_print(f"Error uploading signature: {str(e)}", "ERROR")
            return Response(
                {"error": f"Error uploading signature: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
