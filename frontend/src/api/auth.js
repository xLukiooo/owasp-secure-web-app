import { apiRequest, ensureCsrfToken, translateMessage } from './apiBase';

const authEndpoints = {
  register: '/register/',
  login: '/auth/token/',
  passwordReset: '/auth/password_reset/',
  passwordResetConfirm: '/auth/password_reset/confirm/',
  logout: '/logout/',
  isLoggedIn: '/is-logged-in/',
  resendActivation: '/resend-activation/',
  activate: '/activate/', // Endpoint aktywacyjny konta
};

/**
 * Rejestruje nowego użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} email - Adres e-mail.
 * @param {string} firstName - Imię użytkownika.
 * @param {string} lastName - Nazwisko użytkownika.
 * @param {string} password - Hasło użytkownika.
 * @param {string} password2 - Potwierdzenie hasła.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON.
 * @throws {Error} Jeśli rejestracja się nie powiedzie.
 */
export async function register(username, email, firstName, lastName, password, password2) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.register, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password2
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessages = Object.entries(errorData)
        .map(([_, msgs]) =>
          Array.isArray(msgs)
            ? msgs.map(translateMessage).join(' ')
            : translateMessage(msgs)
        )
        .join(' | ');
      throw new Error(errorMessages);
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w rejestracji:', error);
    throw error;
  }
}

/**
 * Loguje użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @param {string} password - Hasło użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON (np. token dostępu).
 * @throws {Error} Jeśli logowanie się nie powiedzie.
 */
export async function login(username, password) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.login, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w logowaniu:', error);
    throw error;
  }
}

/**
 * Inicjuje proces resetowania hasła.
 * @param {string} email - Adres e-mail użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera z informacjami o procesie resetu hasła.
 * @throws {Error} Jeśli resetowanie hasła się nie powiedzie.
 */
export async function resetPassword(email) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.passwordReset, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Błąd resetowania hasła');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd podczas resetowania hasła:', error);
    throw error;
  }
}

/**
 * Potwierdza i finalizuje resetowanie hasła przy użyciu tokena.
 * @param {string} token - Token resetowania hasła.
 * @param {string} newPassword - Nowe hasło.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON.
 * @throws {Error} Jeśli resetowanie hasła się nie powiedzie.
 */
export async function confirmResetPassword(token, newPassword) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.passwordResetConfirm, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({
        token: token,
        password: newPassword,
      })
    });

    if (!response.ok) {
      throw new Error('Nie udało się zresetować hasła');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd przy potwierdzaniu resetu hasła:', error);
    throw error;
  }
}

/**
 * Wylogowuje bieżącego użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON.
 * @throws {Error} Jeśli wylogowywanie się nie powiedzie.
 */
export async function logout() {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.logout, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
    });

    if (!response.ok) {
      throw new Error('Błąd przy wylogowywaniu');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd podczas wylogowywania:', error);
    throw error;
  }
}

/**
 * Sprawdza, czy użytkownik jest aktualnie zalogowany oraz czy posiada rolę moderatora.
 * @returns {Promise<{isLoggedIn: boolean, isModerator: boolean}>} Obiekt zawierający flagę isLoggedIn (true, jeśli użytkownik jest zalogowany)
 * oraz isModerator (true, jeśli użytkownik należy do grupy Moderator); w przeciwnym razie obie flagi będą false.
 */
export async function checkIsLoggedIn() {
  try {
    const response = await apiRequest(authEndpoints.isLoggedIn, {
      method: 'GET',
    });
    if (!response.ok) {
      return { isLoggedIn: false, isModerator: false };
    }
    const data = await response.json();
    return {
      isLoggedIn: data.isLoggedIn === true,
      isModerator: data.isModerator === true,
    };
  } catch (error) {
    console.error('Błąd sprawdzania zalogowania:', error);
    return { isLoggedIn: false, isModerator: false };
  }
}

/**
 * Wysyła ponownie link aktywacyjny dla użytkownika.
 * @param {string} username - Nazwa użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON.
 * @throws {Error} Jeśli wysłanie linku aktywacyjnego się nie powiedzie.
 */
export async function resendActivation(username) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(authEndpoints.resendActivation, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd przy wysyłaniu linku aktywacyjnego');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd przy wysyłaniu linku aktywacyjnego:', error);
    throw error;
  }
}

/**
 * Aktywuje konto użytkownika.
 * @param {string} uid - Identyfikator użytkownika.
 * @param {string} token - Token aktywacyjny.
 */
export async function activateAccount(uid, token) {
  try {
    // Pobierz CSRF-token
    const csrfToken = await ensureCsrfToken();

    const response = await apiRequest(authEndpoints.activate, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ uid, token })
    });

    const data = await response.json();
    if (!response.ok) {
      // rzuć błąd z komunikatem z backendu
      throw new Error(data.error || 'Błąd aktywacji konta');
    }
    return data;
  } catch (error) {
    console.error('Błąd podczas aktywacji konta:', error);
    throw error;
  }
}