import React, { useState } from 'react';
import PropTypes from 'prop-types';
import KpiCard from './KpiCard';
import '../styles/sidebar.css';

/**
 * Panneau latéral avec filtres et résumé des KPI
 */
const Sidebar = ({ 
  filters, 
  onFilterChange, 
  onFilterApply, 
  onFilterReset,
  kpiData, 
  loading = false 
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const arrondissements = Array.from({ length: 20 }, (_, i) => i + 1);
  const streetTypes = [
    { value: 'primary', label: 'Voies principales' },
    { value: 'secondary', label: 'Voies secondaires' },
    { value: 'tertiary', label: 'Voies tertiaires' },
    { value: 'residential', label: 'Rues résidentielles' },
    { value: 'service', label: 'Rues de service' },
  ];

  const handleInputChange = (key, value) => {
    onFilterChange(key, value || null);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
        aria-expanded={isOpen}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} aria-label="Panneau de filtres">
        <div className="sidebar-header">
          <h2>Filtres</h2>
          {onFilterReset && (
            <button 
              className="sidebar-reset" 
              onClick={onFilterReset}
              aria-label="Réinitialiser tous les filtres"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="sidebar-content">
          {/* Arrondissement Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="arrondissement-select">
              Arrondissement
            </label>
            <select
              id="arrondissement-select"
              className="filter-select"
              value={filters.arrondissement || ''}
              onChange={(e) => handleInputChange('arrondissement', e.target.value)}
              aria-describedby="arrondissement-desc"
            >
              <option value="">Tous</option>
              {arrondissements.map(arr => (
                <option key={arr} value={arr}>{arr}ème</option>
              ))}
            </select>
            <span id="arrondissement-desc" className="sr-only">Filtrer par arrondissement</span>
          </div>

          {/* Type Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="type-select">
              Type de rue
            </label>
            <select
              id="type-select"
              className="filter-select"
              value={filters.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
            >
              <option value="">Tous</option>
              {streetTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Length Filter */}
          <div className="filter-group">
            <label className="filter-label" htmlFor="min-length-input">
              Longueur min (km)
            </label>
            <input
              id="min-length-input"
              type="number"
              className="filter-input"
              step="0.1"
              min="0"
              value={filters.minLength || ''}
              onChange={(e) => handleInputChange('minLength', e.target.value)}
              placeholder="0.5"
            />
          </div>

          {/* Apply Button */}
          <button 
            className="filter-apply" 
            onClick={onFilterApply}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Appliquer les filtres'}
          </button>

          {/* KPI Summary */}
          {kpiData && (
            <div className="kpi-summary">
              <h3>Indicateurs clés</h3>
              <KpiCard
                title="Prix médian m²"
                value={kpiData.prix_m2_median?.toLocaleString('fr-FR') || 'N/A'}
                unit="€"
                icon="💰"
                color="#EF4444"
              />
              <KpiCard
                title="Logements sociaux"
                value={kpiData.logements_sociaux_pct?.toFixed(1) || 'N/A'}
                unit="%"
                icon="🏠"
                color="#10B981"
              />
              <KpiCard
                title="Hotspots Wi-Fi"
                value={kpiData.wifi_count?.toLocaleString() || 'N/A'}
                icon="📶"
                color="#3B82F6"
              />
              <KpiCard
                title="Antennes mobiles"
                value={kpiData.antennes_count?.toLocaleString() || 'N/A'}
                icon="📱"
                color="#8B5CF6"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  filters: PropTypes.object,
  onFilterChange: PropTypes.func.isRequired,
  onFilterApply: PropTypes.func.isRequired,
  onFilterReset: PropTypes.func,
  kpiData: PropTypes.object,
  loading: PropTypes.bool,
};

export default Sidebar;