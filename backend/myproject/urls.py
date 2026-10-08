from django.urls import path, include

# Importy widoków związanych z autoryzacją (plik auth.py)
from api_app.views.auth import (get_csrf_token,CustomTokenObtainPairView,CustomTokenRefreshView,RegisterView,ActivateAccountView,LogoutView,IsLoggedInView,ResendActivationView)

# Importy widoków do obsługi wydatków i kategorii (plik expenses.py)
from api_app.views.expenses import (CategoryListView,ExpenseListView,ExpenseDetailView)

# Import widoku podsumowania (plik summary.py)
from api_app.views.summary import ExpenseSummaryView

# Import widoków moderatora (plik moderator.py)
from api_app.views.moderator import (ModeratorUserListView,ModeratorUserDetailView)
urlpatterns = [
    # --- Endpointy autoryzacji i rejestracji ---
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/activate/', ActivateAccountView.as_view(), name='activate_account'),
    path('api/get-csrf-token/', get_csrf_token, name='get_csrf_token'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/is-logged-in/', IsLoggedInView.as_view(), name='is_logged_in'),
    path('api/resend-activation/', ResendActivationView.as_view(), name='resend_activation'),

    # --- Endpointy do wydatków i kategorii ---
    path('api/categories/', CategoryListView.as_view(), name='category-list'),
    path('api/expenses/', ExpenseListView.as_view(), name='expense-list'),
    path('api/expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),

    # --- Endpointy podsumowania wydatków ---
    path('api/expenses/summary/', ExpenseSummaryView.as_view(), name='expense-summary'),

    # --- Endpointy moderatora ---
    path('api/moderator/users/', ModeratorUserListView.as_view(), name='moderator-users-list'),
    path('api/moderator/users/<int:pk>/', ModeratorUserDetailView.as_view(), name='moderator-user-detail'),
]
