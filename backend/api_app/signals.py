from django.conf import settings
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver, Signal
from django_rest_passwordreset.signals import reset_password_token_created
resend_activation_email = Signal()

def send_custom_email(subject: str, message: str, recipient: str) -> None:
    """
    Wysyła wiadomość e-mail z określonym tematem, treścią oraz adresem odbiorcy.
    
    Używa ustawień aplikacji (settings) do określenia domyślnego nadawcy wiadomości.
    W trybie DEBUG nie blokuje działania aplikacji, jeśli serwer pocztowy nie odpowiada.
    """
    fail_silently = getattr(settings, 'EMAIL_FAIL_SILENTLY', True if settings.DEBUG else False)
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=fail_silently,
    )

@receiver(reset_password_token_created)
def handle_reset_password(sender, instance, reset_password_token, **kwargs):
    """
    Obsługuje sygnał resetowania hasła.
    
    Po wygenerowaniu tokena do resetowania hasła buduje link resetowania i wysyła go na adres e-mail
    użytkownika. Adres e-mail jest pobierany automatycznie z modelu użytkownika.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password/confirm?token={reset_password_token.key}"
    message = f"Użyj poniższego linku do resetowania hasła: {reset_link}"
    send_custom_email("Resetowanie hasła", message, reset_password_token.user.email)

@receiver(post_save, sender=User)
def handle_activation_email(sender, instance, created, **kwargs):
    """
    Obsługuje sygnał zapisu nowego użytkownika (post_save).
    
    Po utworzeniu nowego użytkownika generuje token aktywacyjny, buduje link aktywacyjny
    i wysyła wiadomość e-mail z linkiem do aktywacji konta. Adres e-mail jest pobierany automatycznie
    z modelu użytkownika.
    """
    if created:
        token = default_token_generator.make_token(instance)
        activation_link = f"{settings.FRONTEND_URL}/activate?uid={instance.pk}&token={token}"
        message = f"Aby aktywować konto, kliknij w poniższy link: {activation_link}"
        send_custom_email("Aktywacja konta", message, instance.email)

@receiver(resend_activation_email)
def send_activation_email_on_request(sender, user, **kwargs):
    """
    Odbiornik sygnału resend_activation_email.
    
    Generuje nowy token aktywacyjny i wysyła e-mail z linkiem aktywacyjnym.
    Adres e-mail do wysyłki jest pobierany automatycznie z modelu użytkownika.
    """
    token = default_token_generator.make_token(user)
    activation_link = f"{settings.FRONTEND_URL}/activate?uid={user.pk}&token={token}"
    message = f"Aby aktywować konto, kliknij w poniższy link: {activation_link}"
    send_custom_email("Aktywacja konta", message, user.email)


@receiver(post_migrate)
def create_groups(sender, **kwargs):
    if sender.name == 'api_app':
        moderator_group, created = Group.objects.get_or_create(name='Moderator')
        try:
            view_user = Permission.objects.get(codename='view_user')
            delete_user = Permission.objects.get(codename='delete_user')
            moderator_group.permissions.add(view_user, delete_user)
            if created:
                print("Grupa 'Moderator' została utworzona wraz z przypisaniem uprawnień.")
        except Permission.DoesNotExist:
            print("Uwaga: Nie znaleziono wymaganych uprawnień (view_user lub delete_user).")
