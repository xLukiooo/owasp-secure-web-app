import time

from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.http import base36_to_int
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from django.core.cache import cache

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle

from ..serializers import RegisterSerializer
from ..signals import resend_activation_email

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Zwraca token CSRF w formacie JSON.

    Funkcja zabezpiecza widok, ustawiając ciasteczko CSRF w przeglądarce użytkownika,
    a następnie zwraca token w formacie JSON. Token ten jest wykorzystywany przez front-end
    do zabezpieczenia żądań przed atakami CSRF.
    """
    csrf_token = get_token(request)
    return JsonResponse({'csrftoken': csrf_token})

@method_decorator(csrf_protect, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Rozszerzony widok logowania JWT z:

      - Ochroną CSRF przy pomocy @csrf_protect.
      - Limitowaniem zapytań ScopedRateThrottle (scope='login').
      - Mechanizmem „linear back-off” przy kolejnych nieudanych próbach logowania.
      - Śledzeniem nieudanych prób w cache i resetem licznika przy sukcesie.
      - Sprawdzeniem aktywności konta (401 + action='resend_activation').
      - Generowaniem i ustawianiem ciasteczek JWT przy sukcesie.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope   = 'login'

    def post(self, request, *args, **kwargs):
        identifier = request.data.get('username') or request.META.get('REMOTE_ADDR')
        cache_key = f'login_failures_{identifier}'
        failures = cache.get(cache_key, 0)
        if failures > 1:
            time.sleep(min(failures - 1, 3))

        username = request.data.get('username')
        if username:
            try:
                user = User.objects.get(username=username)
                if not user.is_active:
                    return Response(
                        {"error": "Konto nie zostało aktywowane.", "action": "resend_activation"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except User.DoesNotExist:
                pass

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            cache.set(cache_key, failures + 1, timeout=getattr(settings, 'LOGIN_FAILURE_TIMEOUT', 900))
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

        cache.delete(cache_key)
        user = serializer.user
        user.last_login = timezone.now()
        user.save()

        data = serializer.validated_data
        response = Response(data, status=status.HTTP_200_OK)
        response.set_cookie(
            settings.JWT_AUTH_COOKIE,
            data['access'],
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Strict',
            path='/'
        )
        response.set_cookie(
            settings.JWT_AUTH_REFRESH_COOKIE,
            data['refresh'],
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Strict',
            path='/'
        )
        return response

@method_decorator(csrf_protect, name='dispatch')
class CustomTokenRefreshView(TokenRefreshView):
    """
    Widok odświeżania tokena JWT z ochroną CSRF i ponownym ustawianiem ciasteczek.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope   = 'login'

    def post(self, request, *args, **kwargs):
        refresh_cookie = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if refresh_cookie:
            request.data['refresh'] = refresh_cookie

        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            response.set_cookie(
                settings.JWT_AUTH_COOKIE,
                data['access'],
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Strict',
                path='/'
            )
            response.set_cookie(
                settings.JWT_AUTH_REFRESH_COOKIE,
                data['refresh'],
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Strict',
                path='/'
            )
        return response

@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    """
    Rejestracja użytkownika przez POST z walidacją.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'registration'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"id": user.id, "username": user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_protect, name='dispatch')
class ActivateAccountView(APIView):
    """
    Aktywacja konta przez POST.

    Oczekuje JSON z polami 'uid' i 'token'.
    Zwraca szczegółowe komunikaty o stanie konta.
    """
    permission_classes = []
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'registration'

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')

        if not uid or not token:
            return Response({"error": "Uid i token są wymagane."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"error": "Użytkownik nie istnieje."}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_active:
            return Response({"error": "Konto już aktywne."}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({"message": "Konto pomyślnie aktywowane."}, status=status.HTTP_200_OK)
        else:
            try:
                ts_b36, _ = token.split("-")
                ts = base36_to_int(ts_b36)
                age = default_token_generator._num_seconds(default_token_generator._now()) - ts
                if age > settings.PASSWORD_RESET_TIMEOUT:
                    return Response({"error": "Token wygasł."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                pass
            return Response({"error": "Nieprawidłowy token."}, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    """Wylogowanie użytkownika przez usunięcie ciasteczek JWT."""
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'user'

    def post(self, request):
        response = Response({"message": "Wylogowano."}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.JWT_AUTH_COOKIE, path='/', samesite='Strict')
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE, path='/', samesite='Strict')
        return response

class IsLoggedInView(APIView):
    """Sprawdzenie statusu zalogowania i roli moderatora."""
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'user'

    def get(self, request):
        user = request.user
        is_mod = user.groups.filter(name='Moderator').exists()
        return Response({'isLoggedIn': True, 'isModerator': is_mod})

@method_decorator(csrf_protect, name='dispatch')
class ResendActivationView(APIView):
    """
    Ponowne wysłanie linku aktywacyjnego przez POST.
    Chroni przed enumeracją kont użytkowników (zawsze zwraca neutralny status 200).
    """
    permission_classes = []
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'registration'

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({"error": "Nazwa użytkownika wymagana."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(username=username)
            if not user.is_active:
                resend_activation_email.send(sender=self.__class__, user=user)
        except User.DoesNotExist:
            pass
        return Response(
            {"message": "Jeśli konto istnieje i nie zostało aktywowane, link aktywacyjny został wysłany."},
            status=status.HTTP_200_OK
        )
