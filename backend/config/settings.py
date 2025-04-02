import os
from pathlib import Path
from dotenv import load_dotenv
from utils import pretty_print
import sys

# Load dotenv variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

AUTH_USER_MODEL = "api.User"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

if DEBUG:
    X_FRAME_OPTIONS = "ALLOWALL"

# WARNING: change in production
ALLOWED_HOSTS = [
    os.getenv("WEBSITE_HOSTNAME", "localhost"),
    ".azurewebsites.net",
    "127.0.0.1",
]


# Application definition

INSTALLED_APPS = [
    "api",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "corsheaders",
    #"django_auth_adfs",
]

MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]


# Azure Entra ID
AUTH_ADFS = {
    "AUDIENCE": os.getenv("MICROSOFT_GRAPH_KEY"),
    "CLIENT_ID": os.getenv("MICROSOFT_GRAPH_KEY"),
    "CLIENT_SECRET": os.getenv("MICROSOFT_GRAPH_SECRET"),
    "TENANT_ID": os.getenv("MICROSOFT_TENANT_ID"),
    "RELYING_PARTY_ID": os.getenv("MICROSOFT_GRAPH_KEY"),
    "USERNAME_CLAIM": "upn",
    "CLAIM_MAPPING": {
        "first_name": "given_name",
        "last_name": "family_name",
        "email": "upn",
    },
    "RETRIES": 3,  # Number of retries for retrieving certificates
}


AUTHENTICATION_BACKENDS = (
    #"django_auth_adfs.backend.AdfsAuthCodeBackend",
    "django.contrib.auth.backends.ModelBackend",
)


STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
pretty_print("Got .env THIS FILE SHOULD NOT BE EMPTY", "WARNING")
pretty_print(f"DB_NAME: {os.getenv('DB_NAME')}", "WARNING")
pretty_print(f"DB_USER: {os.getenv('DB_USER')}", "WARNING")
pretty_print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}", "WARNING")
pretty_print(f"DB_HOST: {os.getenv('DB_HOST')}", "WARNING")
pretty_print(f"DB_PORT: {os.getenv('DB_PORT')}", "WARNING")
pretty_print(f"MICROSOFT_GRAPH_KEY: {os.getenv('MICROSOFT_GRAPH_KEY')}", "WARNING")
pretty_print(
    f"MICROSOFT_GRAPH_SECRET: {os.getenv('MICROSOFT_GRAPH_SECRET')}", "WARNING"
)
pretty_print(
    f"MICROSOFT_BACKEND_REDIRECT_URL: {os.getenv('MICROSOFT_BACKEND_REDIRECT_URL')}",
    "WARNING",
)
pretty_print(
    f"MICROSOFT_FRONTEND_REDIRECT_URL: {os.getenv('MICROSOFT_FRONTEND_REDIRECT_URL')}",
    "WARNING",
)


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-request-with",
]

CORS_ALLOW_CREDENTIALS = True

# Update session/cookie settings
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # Needs to be accessible by JS
CORS_EXPOSE_HEADERS = ["Content-Type", "X-CSRFToken"]
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]

# Security Settings for Development (HTTP)
CSRF_COOKIE_SAMESITE = "Lax"  # Allow cross-origin cookies
SESSION_COOKIE_SAMESITE = "Lax"  # Can be 'None' if using HTTPS
CSRF_COOKIE_SECURE = (
    False  # Only for development (False for HTTP, True in production (HTTPS))
)
SESSION_COOKIE_SECURE = (
    False  # Only for development (False for HTTP, True in production (HTTPS))
)

# Session Persistence
SESSION_COOKIE_AGE = 1209600  # 2 weeks (default)
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Persist across browser restarts
SESSION_SAVE_EVERY_REQUEST = True  # Renew session on activity

# REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",  # Force JSON even in DEBUG
    ],
    "EXCEPTION_HANDLER": "api.utils.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.openapi.AutoSchema",
}


CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
