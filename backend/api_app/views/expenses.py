from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.db.models import Sum
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle

from itertools import groupby
from operator import itemgetter

from ..models import Category, Expense
from ..serializers import CategorySerializer, ExpenseSerializer

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CategoryListView(APIView):
    """
    Widok obsługujący listę kategorii.

    GET:
      - Wymaga autoryzacji (IsAuthenticated).
      - Ustawia ciasteczko CSRF przy pierwszym żądaniu.
      - Zwraca listę wszystkich kategorii (id, name).
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'expense'

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@method_decorator(csrf_protect, name='dispatch')
class ExpenseListView(APIView):
    """
    Widok obsługujący listę wydatków i tworzenie nowego wydatku.

    GET:
      - Wymaga autoryzacji.
      - Zwraca pogrupowane wg daty wydatki zalogowanego użytkownika.
    POST:
      - Wymaga autoryzacji.
      - Tworzy nowy wydatek.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'expense'

    def get(self, request):
        expenses = Expense.objects.filter(user=request.user).order_by('-date')
        serializer = ExpenseSerializer(expenses, many=True)
        expenses_data = sorted(serializer.data, key=itemgetter('date'), reverse=True)
        grouped = []
        for date_key, items in groupby(expenses_data, key=itemgetter('date')):
            group_list = []
            for exp in items:
                entry = exp.copy()
                entry.pop('date', None)
                group_list.append(entry)
            grouped.append({'date': date_key, 'expenses': group_list})
        return Response(grouped, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_protect, name='dispatch')
class ExpenseDetailView(APIView):
    """
    Widok obsługujący szczegóły, edycję i usuwanie wydatku.

    GET:
      - Wymaga autoryzacji.
    PUT:
      - Wymaga autoryzacji.
      - Aktualizuje wydatek częściowo.
    DELETE:
      - Wymaga autoryzacji.
      - Usuwa wydatek.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [ScopedRateThrottle]
    throttle_scope     = 'expense'

    def get_object(self, pk, user):
        try:
            return Expense.objects.get(pk=pk, user=user)
        except Expense.DoesNotExist:
            return None

    def get(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response({'error': 'Nie znaleziono wydatku.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(exp)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response({'error': 'Nie znaleziono wydatku.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(exp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        exp = self.get_object(pk, request.user)
        if not exp:
            return Response(status=status.HTTP_404_NOT_FOUND)
        exp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
