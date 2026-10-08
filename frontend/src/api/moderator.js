import { apiRequest, ensureCsrfToken } from './apiBase';

/**
 * Definicja endpointów związanych z operacjami moderatora.
 * @constant {object}
 */
const moderatorEndpoints = {
  users: '/moderator/users/',
  userDetail: (id) => `/moderator/users/${id}/`,
};

/**
 * Pobiera listę użytkowników (dla moderatora).
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON zawierającego listę użytkowników.
 * @throws {Error} W przypadku błędu pobierania listy użytkowników.
 */
export async function getModeratorUsers() {
  try {
    const response = await apiRequest(moderatorEndpoints.users, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania listy użytkowników');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getModeratorUsers:', error);
    throw error;
  }
}

/**
 * Pobiera szczegóły konkretnego użytkownika na podstawie jego ID.
 * @param {number} userId - ID użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera zawierająca szczegóły użytkownika.
 * @throws {Error} W przypadku błędu pobierania szczegółów użytkownika.
 */
export async function getModeratorUser(userId) {
  try {
    const response = await apiRequest(moderatorEndpoints.userDetail(userId), {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania szczegółów użytkownika');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getModeratorUser:', error);
    throw error;
  }
}

/**
 * Usuwa użytkownika o podanym ID.
 * @param {number} userId - ID użytkownika do usunięcia.
 * @returns {Promise<boolean>} True, jeśli użytkownik został pomyślnie usunięty.
 * @throws {Error} W przypadku błędu przy usuwaniu użytkownika.
 */
export async function deleteModeratorUser(userId) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(moderatorEndpoints.userDetail(userId), {
      method: 'DELETE',
      headers: { 'X-CSRFToken': csrfToken },
    });
    if (!response.ok) {
      throw new Error('Błąd przy usuwaniu użytkownika');
    }
    return true;
  } catch (error) {
    console.error('Błąd w deleteModeratorUser:', error);
    throw error;
  }
}
