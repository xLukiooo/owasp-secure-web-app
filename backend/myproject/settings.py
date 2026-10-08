"""
Poniższy plik zawiera konfigurację projektu Django.
UWAGA: Jeśli wdrażasz backend na AWS Lambda i frontend na S3, poniższe ustawienia należy dostosować do środowiska produkcyjnego.
"""

import os
from pathlib import Path
from datetime import timedelta
import environ


"""
Określenie ścieżki bazowej projektu.
Ta konfiguracja pozostaje bez zmian niezależnie od środowiska wdrożenia.
"""
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'django-insecure-development-secret-key-change-in-prod'),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1', 'backend', 'web', '0.0.0.0']),
    FRONTEND_URL=(str, 'http://localhost:3000'),
    EMAIL_BACKEND=(str, 'django.core.mail.backends.console.EmailBackend'),
    EMAIL_HOST=(str, 'localhost'),
    EMAIL_PORT=(int, 25),
    EMAIL_USE_TLS=(bool, False),
    EMAIL_HOST_USER=(str, ''),
    EMAIL_HOST_PASSWORD=(str, ''),
    DEFAULT_FROM_EMAIL=(str, 'no-reply@fintrack.local'),
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

"""
Konfiguracja trybu debugowania i klucza tajnego.
W produkcji ustaw DEBUG na False oraz podaj bezpieczny SECRET_KEY.
"""
DEBUG = env('DEBUG')
SECRET_KEY = env('SECRET_KEY')

"""
Lista dozwolonych hostów.
Domyślnie dopuszcza localhost i kontenery Docker.
"""
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

"""
Konfiguracja nagłówków CORS.
Upewnij się, że w środowisku produkcyjnym dodasz domeny frontendu (np. adres S3 lub CloudFront).
"""
CORS_ALLOW_HEADERS = [
    "content-type",
    "authorization",
    "x-csrftoken",
]

"""
Definicja zainstalowanych aplikacji.
Dołączono dodatkowe aplikacje, takie jak django-csp, rest_framework_simplejwt, corsheaders,
django_rest_passwordreset oraz własną aplikację 'api_app'.
"""
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api_app',
    'django_rest_passwordreset',
    'csp',
]

"""
Lista middleware.
Django-csp oraz corsheaders umieszczone są na początku, aby odpowiednio ustawić nagłówki CSP i CORS.
"""
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

"""
Konfiguracja Django REST Framework.
Mechanizmy autoryzacji oraz throttlingu są skonfigurowane, aby zabezpieczyć API.
Backend musi zawsze weryfikować autoryzację niezależnie od ustawień frontendu.
"""
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api_app.custom_auth.CookieJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':         '20/min',
        'user':         '1000/day',
        'moderator':    '200/day',
        'login':        '10/min',
        'registration': '5/min',
        'expense':      '60/min',
    }
}

"""
Główny moduł URL dla projektu.
Nie wymaga zmiany przy wdrożeniu, chyba że zmienisz strukturę URL.
"""
ROOT_URLCONF = 'myproject.urls'

"""
Konfiguracja szablonów Django.
Jeśli korzystasz z niestandardowych szablonów lub serwujesz je inaczej w produkcji, dostosuj tę sekcję.
"""
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

"""
Określenie aplikacji WSGI.
W środowisku AWS Lambda (np. przy użyciu Zappa) ta konfiguracja może wymagać modyfikacji.
"""
WSGI_APPLICATION = 'myproject.wsgi.application'

"""
Konfiguracja bazy danych.
Dane połączenia są pobierane z pliku .env.
W produkcji upewnij się, że baza danych jest odpowiednio zabezpieczona i skonfigurowana.
"""
DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
    }
}
FRONTEND_URL = env('FRONTEND_URL')

"""
Walidatory haseł.
Wymagania dotyczące haseł są ustawione, aby zwiększyć bezpieczeństwo użytkowników.
"""
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'api_app.validators.SpecialCharacterValidator',
    },
]

"""
Konfiguracja internacjonalizacji.
Dostosuj LANGUAGE_CODE i TIME_ZONE według potrzeb, szczególnie jeśli Twoi użytkownicy są z innego regionu.
"""
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

"""
Konfiguracja plików statycznych.
W produkcji możesz potrzebować użyć innego rozwiązania, np. hostingu statycznych plików na S3.
"""
STATIC_URL = 'static/'

"""
Domyślny typ pola dla modeli.
Nie wymaga zmiany przy wdrożeniu.
"""
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

"""
Konfiguracja tokenów JWT.
Dostosuj czasy życia tokenów według wymagań bezpieczeństwa.
"""
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),  # Nagłówek 'Bearer <token>'
    'ROTATE_REFRESH_TOKENS': True,  # Generowanie nowego refresh tokenu przy odświeżeniu
}

"""
Konfiguracja CORS dla środowiska deweloperskiego.
W produkcji dodaj adresy domen frontendu (np. adres S3 lub CloudFront).
"""
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=["http://localhost:3000"])
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True  # Używane przy autoryzacji opartej o ciasteczka

"""
Konfiguracja zabezpieczeń ciasteczek i HTTPS.
W produkcji automatycznie wymuszane jest HTTPS i HSTS; w trybie deweloperskim
wyłączone, aby umożliwić bezproblemowe testowanie lokalne po HTTP.
"""
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
else:
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False

"""
Konfiguracja e-maili.
Dane konfiguracyjne pobierane z pliku .env – domyślnie konsola dla środowiska lokalnego.
"""
EMAIL_BACKEND = env('EMAIL_BACKEND')
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = env.int('EMAIL_PORT') 
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS')
EMAIL_HOST_USER = env('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL')

"""
Nazwy ciasteczek dla tokenów JWT.
Te ustawienia są używane przez customowy mechanizm autoryzacji opartej na ciasteczkach.
"""
JWT_AUTH_COOKIE = 'access_token'
JWT_AUTH_REFRESH_COOKIE = 'refresh_token'

"""
Dodatkowe zabezpieczenia HTTP.
"""
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'

"""
Konfiguracja polityki Content Security Policy (CSP) przy użyciu django-csp.
Dla środowiska deweloperskiego:
  - Frontend działa na http://localhost:3000,
  - Backend na http://localhost:8000.
W produkcji zmień adresy na domeny odpowiednio:
  - Frontend: adres hostingu S3/CloudFront,
  - Backend: adres API wystawionego przez AWS API Gateway lub inny serwer.
"""
CSP_DEFAULT_SRC = ("'self'", "http://localhost:3000")
CSP_SCRIPT_SRC  = ("'self'", "http://localhost:3000")
CSP_STYLE_SRC   = ("'self'", "'unsafe-inline'", "http://localhost:3000")
CSP_IMG_SRC     = ("'self'", "data:", "http://localhost:3000")
CSP_FONT_SRC    = ("'self'", "http://localhost:3000")
CSP_CONNECT_SRC = ("'self'", "http://localhost:3000", "http://localhost:8000")


"""
Token resetowania hasła i aktywacji konta ważny przez 3 dni
"""
PASSWORD_RESET_TIMEOUT = 259200
