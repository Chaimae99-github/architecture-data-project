import React from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge';
import '../styles/popup.css';


/**
 * Contenu des popups affichés au clic sur la carte
 */
const PopupContent = ({ feature, onClose }) => {
  if (!feature) return null;

  const { properties, geometry } = feature;
  const {
    name,
    type,
    arrondissement,
    length_km,
    street_id,
    ...otherProps
  } = properties || {};

  // Formater le type pour l'affichage
  const getTypeLabel = (type) => {
    const types = {
      primary: 'Voie principale',
      secondary: 'Voie secondaire',
      tertiary: 'Voie tertiaire',
      residential: 'Rue résidentielle',
      service: 'Rue de service',
    };
    return types[type] || type || 'Non spécifié';
  };

  return (
    <div className="popup-content">
      <button 
        className="popup-close" 
        onClick={onClose}
        aria-label="Fermer"
      >
        ×
      </button>
      
      <h3 className="popup-title">{name || 'Rue sans nom'}</h3>
      
      <div className="popup-details">
        {type && (
          <div className="popup-row">
            <span className="popup-label">Type :</span>
            <span className="popup-value">
              <Badge variant={`${type}_street`} size="sm">
                {getTypeLabel(type)}
              </Badge>
            </span>
          </div>
        )}
        
        {arrondissement && (
          <div className="popup-row">
            <span className="popup-label">Arrondissement :</span>
            <span className="popup-value">
              <Badge variant="info" size="sm">
                {arrondissement}
              </Badge>
            </span>
          </div>
        )}
        
        {length_km && (
          <div className="popup-row">
            <span className="popup-label">Longueur :</span>
            <span className="popup-value">{length_km.toFixed(2)} km</span>
          </div>
        )}

        {street_id && (
          <div className="popup-row">
            <span className="popup-label">ID :</span>
            <span className="popup-value">{street_id}</span>
          </div>
        )}
      </div>
      
      <div className="popup-footer">
        <span className="popup-source">Source: OpenStreetMap</span>
      </div>
    </div>
  );
};

PopupContent.propTypes = {
  feature: PropTypes.shape({
    properties: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
      arrondissement: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      length_km: PropTypes.number,
      street_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  }),
  onClose: PropTypes.func.isRequired,
};

export default PopupContent;