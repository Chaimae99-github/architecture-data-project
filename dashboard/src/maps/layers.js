import { colorScales, getStreetColor } from './colors';

/**
 * Couche pour les rues (lignes colorées par type)
 * @param {string} sourceId - ID de la source
 * @returns {Object} Définition de la couche Mapbox
 */
export const createStreetLayer = (sourceId = 'streets') => ({
  id: 'streets-layer',
  type: 'line',
  source: sourceId,
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-color': [
      'match',
      ['get', 'type'],
      'primary', '#FF6B6B',
      'secondary', '#4ECDC4',
      'tertiary', '#45B7D1',
      'residential', '#96CEB4',
      'service', '#FFEAA7',
      'motorway', '#FF8C42',
      '#D3D3D3',
    ],
    'line-width': 2,
    'line-opacity': 0.8,
  },
});

/**
 * Couche pour les arrondissements (choroplèthe)
 * @param {string} sourceId - ID de la source
 * @param {string} colorProperty - Propriété utilisée pour la couleur
 * @param {Object} colorScale - Palette de couleurs
 * @returns {Object} Définition de la couche Mapbox
 */
export const createChoroplethLayer = (sourceId = 'arrondissements', colorProperty = 'prix_m2_median', colorScale = colorScales.prix_m2) => ({
  id: 'choropleth-layer',
  type: 'fill',
  source: sourceId,
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', colorProperty],
      ...colorScale.stops.flat(),
    ],
    'fill-opacity': 0.6,
    'fill-outline-color': '#ffffff',
  },
});

/**
 * Couche pour les contours des arrondissements
 * @param {string} sourceId - ID de la source
 * @returns {Object} Définition de la couche Mapbox
 */
export const createOutlineLayer = (sourceId = 'arrondissements') => ({
  id: 'outline-layer',
  type: 'line',
  source: sourceId,
  paint: {
    'line-color': '#000000',
    'line-width': 1,
    'line-opacity': 0.3,
  },
});

/**
 * Couche pour les hotspots Wi-Fi (points)
 * @param {string} sourceId - ID de la source
 * @returns {Object} Définition de la couche Mapbox
 */
export const createWifiLayer = (sourceId = 'wifi') => ({
  id: 'wifi-layer',
  type: 'circle',
  source: sourceId,
  paint: {
    'circle-radius': 6,
    'circle-color': '#00BFFF',
    'circle-opacity': 0.8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
});

/**
 * Couche pour les antennes mobiles
 * @param {string} sourceId - ID de la source
 * @returns {Object} Définition de la couche Mapbox
 */
export const createAntenneLayer = (sourceId = 'antennes') => ({
  id: 'antennes-layer',
  type: 'circle',
  source: sourceId,
  paint: {
    'circle-radius': 4,
    'circle-color': '#FF6347',
    'circle-opacity': 0.7,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
});

/**
 * Couche pour le survol (highlight)
 * @returns {Object} Définition de la couche Mapbox
 */
export const createHighlightLayer = () => ({
  id: 'highlight-layer',
  type: 'line',
  source: 'streets',
  paint: {
    'line-color': '#FFD700',
    'line-width': 4,
    'line-opacity': 1,
  },
  filter: ['==', 'street_id', ''],
});

export default {
  createStreetLayer,
  createChoroplethLayer,
  createOutlineLayer,
  createWifiLayer,
  createAntenneLayer,
  createHighlightLayer,
};