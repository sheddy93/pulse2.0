"""
PulseHR - Cookie-Based Authentication Middleware
=================================================

This middleware enables DRF TokenAuthentication to read tokens from
HttpOnly cookies instead of requiring the Authorization header.

Security Features:
- HttpOnly cookies cannot be accessed via JavaScript (XSS protection)
- Token is automatically read from cookie on each request
- Supports both cookie-based and header-based authentication
- Falls back to Authorization header for API clients

Usage:
    The browser automatically sends cookies with each request.
    No JavaScript code needed to read/write the auth token.
"""

import logging
from django.conf import settings

logger = logging.getLogger("pulsehr.auth")


class CookieAuthMiddleware:
    """
    Middleware that extracts auth token from HttpOnly cookie
    and makes it available for DRF's TokenAuthentication.

    This allows:
    - Browser clients: Automatic cookie-based authentication
    - API clients: Authorization header authentication (backward compatible)
    - Mobile apps: Both cookie and header authentication
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the auth cookie name from settings
        cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'auth_token')

        # Extract token from HttpOnly cookie
        auth_token = request.COOKIES.get(cookie_name)

        if auth_token:
            # Store the token in request for DRF's TokenAuthentication to use
            # DRF looks for token in request.auth when using SessionAuthentication
            # For TokenAuthentication, we need to manually set it

            # Check if there's no Authorization header (cookie-only auth)
            auth_header = request.headers.get('Authorization', '')

            if not auth_header and auth_token:
                # Set the token on request for DRF authentication
                # This approach works with DRF's authentication system
                request._force_auth_token = auth_token

                logger.debug(
                    "Cookie auth token found",
                    extra={"path": request.path, "method": request.method}
                )

        response = self.get_response(request)
        return response


class CookieAuthAuthentication:
    """
    Custom authentication class that reads from HttpOnly cookie.
    Used by DRF to authenticate requests using the cookie token.
    """

    def authenticate(self, request):
        """
        Authenticate the request using the token from HttpOnly cookie.

        Returns:
            Tuple of (user, token) if authenticated, None otherwise.
        """
        # Check for manually set token from middleware
        auth_token = getattr(request, '_force_auth_token', None)

        # Also check cookies directly
        if not auth_token:
            cookie_name = getattr(settings, 'AUTH_COOKIE_NAME', 'auth_token')
            auth_token = request.COOKIES.get(cookie_name)

        if not auth_token:
            return None

        # Import here to avoid circular imports
        from rest_framework.authtoken.models import Token

        try:
            # Find the token in database
            token = Token.objects.select_related('user').get(key=auth_token)

            # Check if user is active
            if not token.user.is_active:
                return None

            # Return user and token for DRF authentication system
            return (token.user, token)

        except Token.DoesNotExist:
            logger.warning(
                "Invalid auth token from cookie",
                extra={"path": request.path}
            )
            return None

    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response.
        """
        return 'Token'