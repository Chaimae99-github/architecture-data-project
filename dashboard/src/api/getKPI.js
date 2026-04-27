/**
 * Récupération des indicateurs clés (KPI)
 * Prix au m², logements sociaux, densité Wi-Fi, antennes mobiles
 */

import apiClient from './client';

/**
 * Récupère tous les KPI disponibles
 * @returns {Promise<Object>}
 */
export const getKPI = async () => {
  return apiClient.get('/kpi');
};

/**
 * Récupère les KPI pour un arrondissement spécifique
 * @param {string|number} arrondissement - Numéro d'arrondissement
 * @param {number} year - Année (optionnel)
 * @returns {Promise<Object>}
 */
export const getKPIByArrondissement = async (arrondissement, year = null) => {
  const params = new URLSearchParams();
  params.append('arrondissement', arrondissement);
  if (year) params.append('year', year);
  
  return apiClient.get(`/kpi/arrondissement?${params.toString()}`);
};

/**
 * Compare deux arrondissements sur un KPI spécifique
 * @param {string|number} arr1 - Premier arrondissement
 * @param {string|number} arr2 - Second arrondissement
 * @param {string} kpi - Nom du KPI (prix_m2, logements_sociaux_pct, etc.)
 * @returns {Promise<Object>}
 */
export const getKPIComparison = async (arr1, arr2, kpi) => {
  return apiClient.get(`/kpi/compare?arr1=${arr1}&arr2=${arr2}&kpi=${kpi}`);
};

/**
 * Récupère l'évolution temporelle d'un KPI
 * @param {string} kpi - Nom du KPI
 * @param {string|number} arrondissement - Optionnel
 * @returns {Promise<Object>}
 */
export const getKPITimeline = async (kpi, arrondissement = null) => {
  const params = new URLSearchParams();
  params.append('kpi', kpi);
  if (arrondissement) params.append('arrondissement', arrondissement);
  
  return apiClient.get(`/kpi/timeline?${params.toString()}`);
};

export default { getKPI, getKPIByArrondissement, getKPIComparison, getKPITimeline };

// À ajouter dans getKPI.js

export const getArrondissements = async () => {
  return apiClient.get('/arrondissements');
};

export const getWifiHotspots = async () => {
  return apiClient.get('/wifi');
};

export const getAntennes = async () => {
  return apiClient.get('/antennes');
};