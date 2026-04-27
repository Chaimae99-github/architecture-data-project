/**
 * Récupération d'une rue spécifique par son ID
 */

import apiClient from './client';

/**
 * @param {string|number} id - ID unique de la rue
 * @returns {Promise<Object>} Détails de la rue
 */
export const getRueById = async (id) => {
  if (!id) throw new Error('Rue ID is required');
  
  const data = await apiClient.get(`/rues/${id}`);
  
  return {
    id: data.street_id,
    name: data.name,
    type: data.highway,
    arrondissement: data.arrondissement,
    length_km: data.length_m ? data.length_m / 1000 : null,
    geometry: data.geometry,
    coordinates: data.geometry?.coordinates,
  };
};

/**
 * Recherche une rue par son nom
 * @param {string} name - Nom de la rue (partiel ou complet)
 * @returns {Promise<Array>}
 */
export const getRueByName = async (name) => {
  if (!name) throw new Error('Rue name is required');
  return apiClient.get(`/rues/search?name=${encodeURIComponent(name)}`);
};

/**
 * Récupère toutes les rues d'un arrondissement
 * @param {string|number} arrondissement
 * @returns {Promise<Array>}
 */
export const getRuesByArrondissement = async (arrondissement) => {
  if (!arrondissement) throw new Error('Arrondissement is required');
  return apiClient.get(`/rues/arrondissement/${arrondissement}`);
};

export default getRueById;