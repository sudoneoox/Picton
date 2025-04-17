from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from utils import pretty_print


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
            signature_file = request.FILES["signature"]

            # validate file type
            allowed_types = ["image/jpeg", "image/png", "image/gif"]
            if signature_file.content_type not in allowed_types:
                return Response(
                    {
                        "error": "Invalid file type. Please upload a JPEG, PNG or GIF image"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # validate file size
            if signature_file.size > 2 * 1024 * 1024:
                return Response(
                    {"error": "Signature file too large. Maximum is 2MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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
