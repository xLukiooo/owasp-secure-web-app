from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MinLengthValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()

class Category(models.Model):
    """
    Reprezentuje kategorię wydatków.

    Atrybuty:
    - name: Nazwa kategorii (maks. 100 znaków), unikalna.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        validators=[
            MinLengthValidator(1, message="Nazwa nie może być pusta."),
        ]
    )

    def __str__(self):
        return self.name


class Expense(models.Model):
    """
    Reprezentuje pojedynczy wydatek użytkownika.
    Atrybuty:
    - user: Użytkownik, do którego należy wydatek.
    - category: Kategoria wydatku; przy usunięciu kategorii ustawiana na NULL.
    - amount: Kwota wydatku (maks. 10 cyfr, 2 miejsca po przecinku).
    - date: Data wystąpienia wydatku.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(0.01, message="Kwota musi być większa niż 0."),
        ]
    )
    date = models.DateField()

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(amount__gt=0), name='expense_amount_positive'),
        ]

    def clean(self):
        """
        Dodatkowa walidacja modelu.
        """
        if self.date > timezone.localdate():
            raise ValidationError({'date': "Data nie może być w przyszłości."})

    def __str__(self):
        return f"{self.amount} - {self.date}"