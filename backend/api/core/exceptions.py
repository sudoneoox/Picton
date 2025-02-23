from rest_framework.exceptions import APIException
from rest_framework import status


class AccountInactiveError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Your Account is Inactive"


class InvalidCredentialsError(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Invalid Credentials Provided"


class UserExistsError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "User Already Exists"
