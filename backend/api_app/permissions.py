from rest_framework.permissions import BasePermission

class IsModerator(BasePermission):
    """
    Pozwala na dostęp tylko użytkownikom z grupy 'Moderator'.
    
    Zakładamy, że:
      - 'Moderator' to nazwa grupy w modelu auth.Group,
      - Użytkownik ma przypisane uprawnienia do przeglądania i usuwania innych userów 
        (np. auth.view_user, auth.delete_user),
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name='Moderator').exists()
        )