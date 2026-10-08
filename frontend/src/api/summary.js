import { apiRequest } from './apiBase';

/**
 * Definicja endpointów dla podsumowania wydatków.
 * @constant {object}
 */
const summaryEndpoints = {
  expenseSummary: '/expenses/summary/',
};

/**
 * Pobiera podsumowanie wydatków.
 * @returns {Promise<object>} Odpowiedź serwera zawierająca podsumowanie wydatków.
 * @throws {Error} W przypadku błędu pobierania podsumowania wydatków.
 */
export async function getExpenseSummary() {
  try {
    const response = await apiRequest(summaryEndpoints.expenseSummary, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania podsumowania wydatków');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getExpenseSummary:', error);
    throw error;
  }
}
