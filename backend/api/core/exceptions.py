from rest_framework.exceptions import APIException
from rest_framework import status


class AccountInactiveError(APIException):
    """
    Raised when a user attempts to login to an inactive account

    Returns HTTP 403 Forbidden with a message indicating the account
    is inactive.
    """

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Your Account is Inactive"


class InvalidCredentialsError(APIException):
    """
    Raised when login credentials are invalid

    Returns HTTP 401 Unauthorized with a message indicating the
    credentials provided are invalid.
    """

    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid Credentials Provided"


class UserExistsError(APIException):
    """
    Raised when trying to create a user that already exists

    Returns HTTP 409 Conflict with a message indicating a user
    with the provided details already exists.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "User Already Exists"
