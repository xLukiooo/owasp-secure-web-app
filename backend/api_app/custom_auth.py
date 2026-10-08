from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    """
    Klasa autentykacji oparta na JWT, która pobiera token z ciasteczka HttpOnly.
    
    Token jest odczytywany z ciasteczka o nazwie określonej w settings.JWT_AUTH_COOKIE.
    Jeśli token nie jest obecny, metoda authenticate zwraca None, co oznacza brak autoryzacji.
    W przypadku znalezienia tokena, następuje jego walidacja, a metoda zwraca krotkę (użytkownik, zweryfikowany_token).
    """
    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.JWT_AUTH_COOKIE)
        if raw_token is not None:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        return super().authenticate(request)
