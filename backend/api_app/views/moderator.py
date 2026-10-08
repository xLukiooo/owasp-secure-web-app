from django.contrib.auth.models import User, Group
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

from ..permissions import IsModerator  
from ..serializers import (
    ModeratorUserListSerializer,
    ModeratorUserDetailSerializer
)

class ModeratorUserListView(APIView):
    """
    Widok dla moderatora, zwraca listę zwykłych użytkowników
    (bez siebie i bez moderatorów/superuserów).
    """
    permission_classes = [IsAuthenticated, IsModerator]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'moderator'

    def get(self, request):
        mod_group = Group.objects.filter(name='Moderator').first()
        qs = User.objects.filter(
            is_active=True,
            is_staff=False,
            is_superuser=False
        ).exclude(
            pk=request.user.pk
        )
        if mod_group:
            qs = qs.exclude(groups=mod_group)

        users = qs.order_by('last_name', 'first_name')
        serializer = ModeratorUserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
@method_decorator(csrf_protect, name='dispatch')
class ModeratorUserDetailView(APIView):
    """
    Widok dla moderatora, szczegóły i DELETE.
    Blokujemy każdą operację GET/DELETE na moderatorach,
    superuserach oraz na sobie samym.
    """
    permission_classes = [IsAuthenticated, IsModerator]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'moderator'
    
    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def _is_protected(self, request_user, target_user):
        """ Zwraca True, jeżeli target_user to moderator, superuser lub request_user """
        if target_user.is_superuser or target_user.is_staff:
            return True
        if target_user.pk == request_user.pk:
            return True
        if target_user.groups.filter(name='Moderator').exists():
            return True
        return False

    def get(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj or self._is_protected(request.user, user_obj):
            return Response(
                {"detail": "Nie znaleziono użytkownika."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ModeratorUserDetailSerializer(user_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response(
                {"detail": "Nie znaleziono użytkownika."},
                status=status.HTTP_404_NOT_FOUND
            )
        if self._is_protected(request.user, user_obj):
            return Response(
                {"detail": "Brak uprawnień do usunięcia tego użytkownika."},
                status=status.HTTP_403_FORBIDDEN
            )

        user_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
