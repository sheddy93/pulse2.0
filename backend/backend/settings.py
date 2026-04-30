from pathlib import Path
import os

from dotenv import load_dotenv
from django.utils.translation import gettext_lazy as _


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ============================================================
# SENTRY ERROR MONITORING
# ============================================================
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN", "")
SENTRY_ENVIRONMENT = os.getenv("SENTRY_ENVIRONMENT", "production")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style="url",
                middleware_spans=True,
                signals_spans=True,
            ),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
        # Adjust this value in production to reduce overhead
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        
        # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions.
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
        
        # Environment and release tracking
        environment=SENTRY_ENVIRONMENT,
        release=os.getenv("APP_VERSION", "1.0.0"),
        
        # Error filtering
        send_default_pii=False,  # Don't send personally identifiable information
        
        # Ignore common errors
        ignore_errors=[
            "PermissionDenied",
            "Http404",
        ],
    )


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

# Default includes Render backend URL pattern
_default_hosts = "127.0.0.1,localhost,*.onrender.com"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", _default_hosts).split(",")
    if host.strip()
]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",  # OpenAPI documentation
    "users",
]

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000").split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000").split(",")
    if origin.strip()
]

# CORS Configuration (django-cors-headers)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000").split(",")
    if origin.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.vercel\.app$", r"^https://.*\.onrender\.com$"]
CORS_ALLOW_HEADERS = ["accept", "authorization", "content-type", "origin", "user-agent", "x-csrftoken", "x-requested-with"]
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "backend.middleware.RequestContextMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "backend.middleware.CorsMiddleware",
    "backend.middleware.SecurityHeadersMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# ============================================================
# REDIS CACHING CONFIGURATION
# ============================================================
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_CLASS_KWARGS": {
                "max_connections": 50,
                "retry_on_timeout": True,
            },
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "COMPRESSOR": "django_redis.compressors.zlib.ZlibCompressor",
            "IGNORE_EXCEPTIONS": True,  # Don't crash on Redis failures
        },
        "KEY_PREFIX": "pulsehr",
        "TIMEOUT": 300,  # 5 minutes default
    }
}

# Session configuration with Redis
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_COOKIE_AGE = 86400  # 24 hours


# Support both DATABASE_URL and individual POSTGRES_* variables
if os.getenv("DATABASE_URL"):
    # Use DATABASE_URL from Render Internal Database URL
    import urllib.parse
    db_url = os.getenv("DATABASE_URL")
    parsed = urllib.parse.urlparse(db_url)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path[1:],  # Remove leading /
            "USER": parsed.username,
            "PASSWORD": parsed.password,
            "HOST": parsed.hostname,
            "PORT": str(parsed.port) if parsed.port else "5432",
            "CONN_MAX_AGE": 60,  # Connection pooling - keep connections alive for 60 seconds
            "OPTIONS": {
                "sslmode": "require",
                "connect_timeout": 10,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
            },
        }
    }
elif os.getenv("POSTGRES_DB"):
    # PostgreSQL SSL configuration for Render
    ssl_mode = os.getenv("POSTGRES_SSL_MODE", "require")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER", ""),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,  # Connection pooling - keep connections alive for 60 seconds
            "OPTIONS": {
                "sslmode": ssl_mode,
                "connect_timeout": 10,
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "hr_dev.sqlite3",
            "CONN_MAX_AGE": 60,  # Connection pooling even for SQLite
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "it-it"
LANGUAGES = [
    ("it", _("Italiano")),
    ("en", _("English")),
]
TIME_ZONE = "Europe/Rome"
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [BASE_DIR / "locale"]

# ============================================================
# STRUCTURED LOGGING CONFIGURATION
# ============================================================
# Safe file path for logs (works both locally and on Render)
_log_dir = BASE_DIR / 'logs'
try:
    _log_dir.mkdir(exist_ok=True)
except Exception:
    _log_dir = None  # On Render, logs directory might not be writable

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {funcName}:{lineno} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if DEBUG else 'simple',
        },
    },
    # Build handlers list dynamically based on _log_dir availability
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],  # CRITICAL: errors go to console for Render logs
            'level': 'DEBUG' if DEBUG else 'ERROR',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Log SQL only in DEBUG
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        # Alias loggers for consistency
        'auth': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'api': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}


STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
PROTECTED_DOCUMENTS_ROOT = MEDIA_ROOT / "protected"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"
# In production, use SMTP backend (set DEBUG=false)
# In development (DEBUG=true), emails print to console
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend" if not DEBUG else os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.sendgrid.net")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False").lower() == "true"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "PulseHR <noreply@pulsehr.it>")

# Email templates settings
EMAIL_TEMPLATE_PREFIX = "users/emails/"

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.cookie_auth.CookieAuthAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "users.permissions.IsAuthenticatedAndTenantActive",
    ],
}

ADMIN_SITE_HEADER = "HR SaaS Platform"
ADMIN_SITE_TITLE = "HR SaaS Admin"
ADMIN_INDEX_TITLE = "Platform Control Center"

# ============================================================
# SICUREZZA PRODUZIONE
# ============================================================

# Security settings for production
if not DEBUG:
    # HTTPS
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_HTTPONLY = False  # JS needs to read CSRF token
    
    # Content Security
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Rate limiting per auth
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_EXCEPTION_HANDLER': 'users.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '10/minute',  # Brute force protection
        'register': '5/minute',  # Registration rate limiting
        'password_reset': '3/minute',  # Password reset rate limiting
    },
}

# ============================================================
# SSO/SAML CONFIGURATION
# ============================================================
# SAML DISABILITATO PER SICUREZZA - Non attivo finché non validato
ENABLE_SAML = os.getenv("ENABLE_SAML", "false").lower() == "true"

if not ENABLE_SAML:
    # Disabilita SAML completamente se non configurato
    SAML_IDP_CERTIFICATE = None
    SAML_IDP_ENTITY_ID = None
    SAML_IDP_SSO_URL = None

# PulseHR SSO Base URL (dove risiede l'applicazione)
PULSEHR_BASE_URL = os.getenv("PULSEHR_BASE_URL", "https://app.pulsehr.it")

# Entity ID per SAML (identificatore univoco del Service Provider)
PULSEHR_ENTITY_ID = os.getenv("PULSEHR_ENTITY_ID", "https://app.pulsehr.it")

# Impostazioni sessione per SSO
SSO_SESSION_TIMEOUT_HOURS = int(os.getenv("SSO_SESSION_TIMEOUT_HOURS", "8"))

# ============================================================
# API DOCUMENTATION (drf-spectacular)
# ============================================================

# ============================================================
# FIREBASE CLOUD MESSAGING
# ============================================================
# Firebase Server Key for Push Notifications
# Get from: Firebase Console > Project Settings > Cloud Messaging > Server Key
FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "")

# ============================================================
# STRIPE BILLING SETTINGS
# ============================================================

# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Stripe Price IDs for subscription plans
# Create these in Stripe Dashboard > Products
STRIPE_PRICE_IDS = {
    "starter": os.getenv("STRIPE_PRICE_STARTER", ""),
    "professional": os.getenv("STRIPE_PRICE_PROFESSIONAL", ""),
    "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE",""),
}

# Verify Stripe is configured in production
if not DEBUG and not STRIPE_SECRET_KEY:
    import warnings
    warnings.warn("STRIPE_SECRET_KEY not set! Stripe billing will not work in production.")

SPECTACULAR_SETTINGS = {
    'TITLE': 'PulseHR API',
    'DESCRIPTION': '''
## PulseHR - Enterprise HR Management Platform

### Autenticazione
Tutti gli endpoint richiedono autenticazione tramite Token.
Includi il token nell'header: `Authorization: Token <your_token>`

### Ruoli
- **super_admin**: Amministratore della piattaforma
- **company_owner**: Proprietario azienda
- **company_admin**: Amministratore aziendale
- **hr_manager**: Responsabile HR
- **manager**: Manager di reparto
- **external_consultant**: Consulente esterno
- **employee**: Dipendente

### Multi-tenancy
Tutti i dati sono isolati per azienda. Gli utenti vedono solo i dati della propria azienda.

### Rate Limiting
-Anonimi: 100 richieste/ora
- Autenticati: 1000 richieste/ora
- Login: 10 richieste/minuto
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Auth', 'description': 'Autenticazione e sessioni'},
        {'name': 'Company', 'description': 'Gestione azienda e utenti'},
        {'name': 'Employees', 'description': 'Gestione dipendenti'},
        {'name': 'Attendance', 'description': 'Controllo presenze'},
        {'name': 'Payroll', 'description': 'Gestione payroll'},
        {'name': 'Documents', 'description': 'Gestione documenti'},
        {'name': 'Reports', 'description': 'Report e statistiche'},
        {'name': 'Consultants', 'description': 'Gestione consulenti'},
        {'name': 'Pricing', 'description': 'Piani tariffari e limiti'},
    ],
}



FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")

# ============================================================
# AUTHENTICATION COOKIE SETTINGS
# ====================================

# Name of the HttpOnly cookie containing the auth token
AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "auth_token")

# Cookie expiration time in seconds (default: 7 days)
AUTH_COOKIE_AGE = int(os.getenv("AUTH_COOKIE_AGE", str(86400 * 7)))

# Cookie path
AUTH_COOKIE_PATH = os.getenv("AUTH_COOKIE_PATH", "/")

