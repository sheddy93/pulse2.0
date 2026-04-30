import time
import uuid
import logging

logger = logging.getLogger("pulsehr.request")


class RequestContextMiddleware:
    """Attach a request id and execution timing to every request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        started_at = time.monotonic()
        response = self.get_response(request)
        duration_ms = round((time.monotonic() - started_at) * 1000, 2)
        response["X-Request-ID"] = request.request_id
        response["X-Response-Time-MS"] = str(duration_ms)

        logger.info(
            "request_completed",
            extra={
                "request_id": request.request_id,
                "method": request.method,
                "path": request.path,
                "status_code": getattr(response, "status_code", 200),
                "duration_ms": duration_ms,
                "user_id": str(request.user.id) if getattr(request, "user", None) and getattr(request.user, "is_authenticated", False) else None,
            },
        )
        return response


class SecurityHeadersMiddleware:
    """Basic hardening headers for browser security."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("X-Frame-Options", "DENY")
        response.setdefault("Permissions-Policy", "camera=(self), geolocation=(self), microphone=()")
        response.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        return response


class CorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        allowed_origins = getattr(request, "allowed_cors_origins", None)

        if allowed_origins is None:
            from django.conf import settings
            allowed_origins = settings.CORS_ALLOWED_ORIGINS

        if request.method == "OPTIONS":
            from django.http import HttpResponse
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        if origin in allowed_origins:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With, X-Request-ID"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Vary"] = "Origin"

        return response
