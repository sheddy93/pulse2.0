from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Standard error response format for PulseHR API."""

    response = exception_handler(exc, context)

    if response is not None:
        # Standardizza il formato errore
        error_data = {
            'error': True,
            'code': response.status_code,
        }

        if hasattr(response, 'data'):
            if isinstance(response.data, dict):
                # Campi specifici
                if 'detail' in response.data:
                    error_data['message'] = response.data['detail']
                else:
                    error_data['fields'] = response.data
                    error_data['message'] = 'Validation error'
            elif isinstance(response.data, list):
                error_data['message'] = response.data[0] if response.data else 'Error'
            else:
                error_data['message'] = str(response.data)
        else:
            error_data['message'] = 'An error occurred'

        response.data = error_data

    return response


class APIException(Exception):
    """Base API exception."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'An error occurred'

    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code = code


class ValidationError(APIException):
    """Validation error exception."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'Validation error'


class NotFoundError(APIException):
    """Resource not found exception."""
    status_code = status.HTTP_404_NOT_FOUND
    default_message = 'Resource not found'


class PermissionDeniedError(APIException):
    """Permission denied exception."""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Permission denied'


class TenantAccessError(APIException):
    """Tenant access error - company not active or accessible."""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Tenant access denied'


class EmployeeLimitError(APIException):
    """Employee limit reached for the company plan."""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Employee limit reached'


class RateLimitExceededError(APIException):
    """Rate limit exceeded for this endpoint."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_message = 'Rate limit exceeded. Please try again later.'