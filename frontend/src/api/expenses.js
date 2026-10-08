import { apiRequest, ensureCsrfToken } from './apiBase';

/**
 * Definicja endpointów związanych z wydatkami.
 * @constant {object}
 */
const expensesEndpoints = {
  categories: '/categories/',
  expenses: '/expenses/',
  expenseDetail: (id) => `/expenses/${id}/`,
};

/**
 * Pobiera listę kategorii.
 * @returns {Promise<object>} Odpowiedź serwera w formie obiektu JSON zawierającego listę kategorii.
 * @throws {Error} W przypadku niepowodzenia pobierania kategorii.
 */
export async function getCategories() {
  try {
    const response = await apiRequest(expensesEndpoints.categories, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania kategorii');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getCategories:', error);
    throw error;
  }
}

/**
 * Pobiera listę wydatków zalogowanego użytkownika.
 * @returns {Promise<object>} Odpowiedź serwera zawierająca listę wydatków.
 * @throws {Error} W przypadku błędu pobierania wydatków.
 */
export async function getExpenses() {
  try {
    const response = await apiRequest(expensesEndpoints.expenses, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania wydatków');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getExpenses:', error);
    throw error;
  }
}

/**
 * Pobiera szczegóły pojedynczego wydatku na podstawie jego ID.
 * @param {number} expenseId - ID wydatku.
 * @returns {Promise<object>} Odpowiedź serwera zawierająca szczegóły wydatku.
 * @throws {Error} W przypadku błędu pobierania wydatku.
 */
export async function getExpense(expenseId) {
  try {
    const response = await apiRequest(expensesEndpoints.expenseDetail(expenseId), {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Błąd pobierania wydatku');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w getExpense:', error);
    throw error;
  }
}

/**
 * Tworzy nowy wydatek.
 * @param {Object} expenseData - Obiekt zawierający dane wydatku (np. category, amount, date).
 * @returns {Promise<object>} Odpowiedź serwera zawierająca dane nowo utworzonego wydatku.
 * @throws {Error} W przypadku błędu tworzenia wydatku.
 */
export async function createExpense(expenseData) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(expensesEndpoints.expenses, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd przy tworzeniu wydatku');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w createExpense:', error);
    throw error;
  }
}

/**
 * Aktualizuje istniejący wydatek.
 * @param {number} expenseId - ID wydatku do aktualizacji.
 * @param {Object} expenseData - Obiekt z danymi do aktualizacji.
 * @returns {Promise<object>} Odpowiedź serwera zawierająca zaktualizowane dane wydatku.
 * @throws {Error} W przypadku błędu aktualizacji wydatku.
 */
export async function updateExpense(expenseId, expenseData) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(expensesEndpoints.expenseDetail(expenseId), {
      method: 'PUT',
      headers: { 'X-CSRFToken': csrfToken },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Błąd przy aktualizacji wydatku');
    }
    return await response.json();
  } catch (error) {
    console.error('Błąd w updateExpense:', error);
    throw error;
  }
}

/**
 * Usuwa wydatek.
 * @param {number} expenseId - ID wydatku do usunięcia.
 * @returns {Promise<boolean>} True, jeśli wydatek został pomyślnie usunięty.
 * @throws {Error} W przypadku błędu usuwania wydatku.
 */
export async function deleteExpense(expenseId) {
  try {
    const csrfToken = await ensureCsrfToken();
    const response = await apiRequest(expensesEndpoints.expenseDetail(expenseId), {
      method: 'DELETE',
      headers: { 'X-CSRFToken': csrfToken },
    });
    if (!response.ok) {
      throw new Error('Błąd przy usuwaniu wydatku');
    }
    return true;
  } catch (error) {
    console.error('Błąd w deleteExpense:', error);
    throw error;
  }
}
