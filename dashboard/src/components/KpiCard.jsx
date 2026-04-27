import React from 'react';
import PropTypes from 'prop-types';
import '../styles/kpi.css';



/**
 * Carte d'affichage d'un indicateur clé (KPI)
 */
const KpiCard = ({ 
  title, 
  value, 
  unit = '', 
  variation = null, 
  icon = null, 
  color = '#3B82F6',
  loading = false,
  onClick = null 
}) => {
  const isPositive = variation > 0;
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('fr-FR') 
    : value;

  if (loading) {
    return (
      <div className="kpi-card skeleton" style={{ borderLeftColor: color }}>
        <div className="kpi-card-header">
          <span className="kpi-icon-placeholder" />
          <h3 className="kpi-title">{title}</h3>
        </div>
        <div className="kpi-value-placeholder">---</div>
      </div>
    );
  }

  return (
    <div 
      className="kpi-card" 
      style={{ borderLeftColor: color }}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="kpi-card-header">
        {icon && <span className="kpi-icon" aria-hidden="true">{icon}</span>}
        <h3 className="kpi-title">{title}</h3>
      </div>
      
      <div className="kpi-value">
        <span className="kpi-number">{formattedValue}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      
      {variation !== null && variation !== undefined && (
        <div className={`kpi-variation ${isPositive ? 'positive' : 'negative'}`}>
          <span aria-hidden="true">{isPositive ? '▲' : '▼'}</span>
          <span>{Math.abs(variation)}%</span>
        </div>
      )}
    </div>
  );
};

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  variation: PropTypes.number,
  icon: PropTypes.node,
  color: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
};

export default KpiCard;