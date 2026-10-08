import Cookies from 'js-cookie';

/**
 * Bazowy URL API.
 * @constant {string}
 */
export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Wspólne endpointy API.
 * @constant {object}
 */
export const commonEndpoints = {
  csrfToken: '/get-csrf-token/',
};

/**
 * Mapa tłumaczeń komunikatów błędów.
 * @constant {object}
 */
export const errorMapping = {
  "This password is too short. It must contain at least 8 characters.": "Hasło jest za krótkie. Musi zawierać przynajmniej 8 znaków.",
  "This password is too common.": "To hasło jest zbyt popularne.",
  "This password is entirely numeric.": "To hasło nie może być wyłącznie numeryczne.",
  "A user with that username already exists.": "Użytkownik o takiej nazwie już istnieje.",
  "Enter a valid email address.": "Wprowadź prawidłowy adres email.",
};

/**
 * Tłumaczy wiadomość błędu na polski, jeśli istnieje odpowiednik.
 * @param {string} msg - Wiadomość błędu do przetłumaczenia.
 * @returns {string} Przetłumaczona wiadomość lub oryginalna wiadomość, jeśli tłumaczenie nie istnieje.
 */
export function translateMessage(msg) {
  return errorMapping[msg] || msg;
}

/**
 * Wykonuje zapytanie HTTP do API.
 * @param {string} endpoint - Endpoint API, który zostanie dołączony do BASE_URL.
 * @param {object} [options={}] - Opcjonalne opcje dla fetch, np. metoda, nagłówki, ciało, itp.
 * @returns {Promise<Response>} Obiekt odpowiedzi z API.
 * @throws {Error} W przypadku niepowodzenia zapytania lub błędu sieciowego.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = BASE_URL + endpoint;
  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  const controller = new AbortController();
  const timeout = options.timeout || 10000;
  const timer = setTimeout(() => controller.abort(), timeout);
  mergedOptions.signal = controller.signal;

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timer);

    // Obsługa 401 i próba odświeżenia tokena
    if (response.status === 401 && endpoint !== commonEndpoints.isLoggedIn) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        return apiRequest(endpoint, options);
      }
    }
  
    return response;
  } catch (error) {
    console.error(`Błąd w apiRequest dla ${url}:`, error);
    throw error;
  }
}

/**
 * Zapewnia, że token CSRF jest dostępny. Pobiera go z ciasteczek lub wykonuje zapytanie do API.
 * @returns {Promise<string>} Token CSRF.
 * @throws {Error} Jeśli nie uda się pobrać tokena.
 */
export async function ensureCsrfToken() {
  try {
    let token = Cookies.get('csrftoken');
    if (!token) {
      const response = await apiRequest(commonEndpoints.csrfToken);
      const data = await response.json();
      token = data.csrftoken;
    }
    return token;
  } catch (error) {
    console.error('Błąd podczas pobierania tokena CSRF:', error);
    throw error;
  }
}

/**
 * Próbuje odświeżyć token uwierzytelniania.
 * @returns {Promise<boolean>} True, jeśli token został pomyślnie odświeżony, w przeciwnym razie false.
 */
async function refreshAuthToken() {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest('/auth/token/refresh/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken
      },
    });
    if (!response.ok) {
      console.error('Nie udało się odświeżyć tokenu');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Błąd podczas odświeżania tokenu:', error);
    return false;
  }
}
