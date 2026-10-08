from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Category, Expense

from datetime import date

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer do rejestracji nowego użytkownika.

    Waliduje unikalność adresu e-mail i nazwy użytkownika, sprawdza zgodność podanych haseł
    oraz stosuje dodatkowe reguły walidacji dla hasła.
    """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Użytkownik z tym adresem e-mail już istnieje.")]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="Użytkownik o tej nazwie już istnieje.")]
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label="Potwierdzenie hasła"
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, data):
        """
        Sprawdza, czy oba podane hasła są identyczne.

        Jeśli hasła nie są zgodne, zgłasza wyjątek walidacji z odpowiednim komunikatem.
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Hasła muszą się zgadzać."})
        return data

    def create(self, validated_data):
        """
        Tworzy nowego użytkownika na podstawie zweryfikowanych danych.

        Usuwa dodatkowe pole 'password2', tworzy użytkownika z ustawionym hasłem,
        a następnie oznacza konto jako nieaktywne (is_active = False).
        """
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.is_active = False
        user.save()
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount', 'date']
    
    def validate_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Data nie może być w przyszłości.")
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Kwota musi być większa niż 0.")
        return value

class ModeratorUserListSerializer(serializers.ModelSerializer):
    """
    Serializer do wyświetlania listy użytkowników dla moderatora.
    Zawiera podstawowe pola: id, first_name, last_name, username.
    """
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username']

class ModeratorUserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer do wyświetlania szczegółów użytkownika dla moderatora.
    Zawiera dodatkowo pole email.
    """
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email']

