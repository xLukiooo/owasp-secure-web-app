from django.db.models import Sum
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

from ..models import Expense

@method_decorator(ensure_csrf_cookie, name='get')
class ExpenseSummaryView(APIView):
    """
    Widok podsumowania wydatków.

    Wymaga autoryzacji (IsAuthenticated) oraz jest zabezpieczony przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca sumę wydatków zalogowanego użytkownika, zgrupowanych według kategorii,
        w zakresie od 1. dnia bieżącego miesiąca do dnia dzisiejszego.
      - Dla każdej kategorii zwraca obiekt JSON zawierający pola:
          - 'category': nazwa kategorii (lub 'Brak kategorii', jeśli pole jest puste),
          - 'total': łączna kwota wydatków w tej kategorii (jako string).
      - Zwraca status 200 (OK) w przypadku powodzenia.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'expense'

    def get(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)

        expenses = Expense.objects.filter(
            user=request.user,
            date__range=[first_day_of_month, today]
        )
        summary = expenses.values('category__name').annotate(total=Sum('amount'))

        data = [
            {
                'category': item['category__name'] or 'Brak kategorii',
                'total': str(item['total'] if item['total'] is not None else '0.00')
            }
            for item in summary
        ]
        return Response(data, status=status.HTTP_200_OK)
