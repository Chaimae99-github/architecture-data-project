/**
 * Récupération de toutes les rues
 * Supporte les filtres par arrondissement, type, longueur
 */

import apiClient from './client';

/**
 * @param {Object} filters - Filtres optionnels
 * @param {string} filters.arrondissement - Numéro d'arrondissement
 * @param {string} filters.type - Type de rue (primary, secondary, etc.)
 * @param {number} filters.minLength - Longueur minimum en km
 * @returns {Promise<Object>} GeoJSON des rues
 */
export const getAllRues = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.arrondissement) params.append('arrondissement', filters.arrondissement);
  if (filters.type) params.append('type', filters.type);
  if (filters.minLength) params.append('min_length', filters.minLength);

  const queryString = params.toString();
  const endpoint = `/rues${queryString ? `?${queryString}` : ''}`;

  const data = await apiClient.get(endpoint);
  
  // Garantir le format GeoJSON
  if (!data.type) {
    return {
      type: 'FeatureCollection',
      features: data.map(item => ({
        type: 'Feature',
        geometry: item.geometry,
        properties: {
          street_id: item.street_id,
          name: item.name,
          type: item.highway,
          arrondissement: item.arrondissement,
          length_km: item.length_m ? item.length_m / 1000 : null,
        },
      })),
    };
  }
  
  return data;
};

export const getStreetsGeoJSON = getAllRues;
export default getAllRues;