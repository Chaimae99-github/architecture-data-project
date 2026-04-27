import ReactDOMServer from 'react-dom/server';
import PopupContent from '../components/PopupContent';

/**
 * Crée le HTML pour un popup à partir d'un feature
 * @param {Object} feature - Feature GeoJSON
 * @param {Function} onClose - Fonction de fermeture
 * @returns {string} HTML du popup
 */
export const createPopupHTML = (feature, onClose) => {
  return ReactDOMServer.renderToString(
    <PopupContent feature={feature} onClose={onClose} />
  );
};

/**
 * Affiche un popup sur la carte
 * @param {Object} map - Instance Mapbox
 * @param {Object} popup - Instance du popup
 * @param {Object} feature - Feature GeoJSON
 * @param {Array} coordinates - Coordonnées [lng, lat]
 * @param {Function} onClose - Fonction de fermeture
 */
export const showPopup = (map, popup, feature, coordinates, onClose) => {
  if (!map || !popup || !feature) return;
  
  const html = createPopupHTML(feature, onClose);
  const lngLat = coordinates || feature.geometry.coordinates[0];
  
  popup
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map);
};

/**
 * Cache un popup
 * @param {Object} popup - Instance du popup
 */
export const hidePopup = (popup) => {
  if (popup) popup.remove();
};

/**
 * Met à jour le contenu d'un popup existant
 * @param {Object} popup - Instance du popup
 * @param {Object} feature - Nouveau feature
 * @param {Function} onClose - Fonction de fermeture
 */
export const updatePopupContent = (popup, feature, onClose) => {
  if (!popup || !feature) return;
  const html = createPopupHTML(feature, onClose);
  popup.setHTML(html);
};

export default { 
  createPopupHTML, 
  showPopup, 
  hidePopup, 
  updatePopupContent,
};