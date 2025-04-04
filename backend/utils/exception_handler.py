from django.core.cache import cache
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .prettyPrint import pretty_print


def custom_exception_handler(exc, context):
    # Default exception handling
    response = exception_handler(exc, context)

    # Handle Throttling exceptions
    if isinstance(exc, Throttled):
        wait_time = exc.wait
        response.data = {
            "error": f"Request was Throttled. Please try again in {wait_time} seconds.",
            "code": response.status_code,
        }
        return response

    # If DRF couldn't handle it
    if response is None:
        pretty_print(f"Unhandled Exception: {str(exc)}", "ERROR")
        return Response(
            {"error": "An unexpected error occurred"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Standardize error format
    error_data = {"error": str(exc), "code": response.status_code}

    # Preserve original error messages
    if hasattr(exc, "detail"):
        error_data["error"] = exc.detail

    return Response(error_data, status=response.status_code)
