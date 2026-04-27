/**
 * API Client centralisé
 * Gère toutes les communications avec le backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Requête HTTP générique
   * @param {string} endpoint - Point d'entrée API (ex: '/rues')
   * @param {Object} options - Options fetch (method, body, headers)
   * @returns {Promise<any>} Données JSON
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Requête timeout après 30 secondes');
      }
      throw error;
    }
  }

  /**
   * Requête GET
   * @param {string} endpoint
   * @returns {Promise<any>}
   */
  get(endpoint) {
    return this.request(endpoint);
  }

  /**
   * Requête POST
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<any>}
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;