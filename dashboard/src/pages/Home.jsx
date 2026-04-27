import React, { useState, useEffect, useCallback } from 'react';
import MapContainer from '../maps/MapContainer';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { getAllRues } from '../api/getAllRues';
import { getKPI, getArrondissements, getWifiHotspots, getAntennes } from '../api/getKPI';
import useFilters from '../hooks/useFilters';
import '../styles/global.css';
import '../styles/map.css';

const Home = () => {
  // ============================================================
  // ÉTATS
  // ============================================================
  const [streetsData, setStreetsData] = useState(null);
  const [arrondissementsData, setArrondissementsData] = useState(null);
  const [wifiData, setWifiData] = useState(null);
  const [antennesData, setAntennesData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [selectedKPI, setSelectedKPI] = useState('prix_m2_median');

  // Filtres
  const { filters, activeFilters, updateFilter, applyFilters, resetFilters, hasActiveFilters } = useFilters({
    arrondissement: null,
    type: null,
    minLength: null,
  });

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================
  
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Chargement parallèle pour meilleure performance
      const [streets, kpi, arrondissements, wifi, antennes] = await Promise.allSettled([
        getAllRues(activeFilters),
        getKPI(),
        getArrondissements(),
        getWifiHotspots(),
        getAntennes()
      ]);

      // Gestion des résultats
      if (streets.status === 'fulfilled') {
        setStreetsData(streets.value);
      } else {
        console.warn('Erreur chargement rues:', streets.reason);
      }

      if (kpi.status === 'fulfilled') {
        setKpiData(kpi.value);
      }

      if (arrondissements.status === 'fulfilled') {
        setArrondissementsData(arrondissements.value);
      }

      if (wifi.status === 'fulfilled') {
        setWifiData(wifi.value);
      }

      if (antennes.status === 'fulfilled') {
        setAntennesData(antennes.value);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  // Chargement initial
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================================
  
  const handleFeatureClick = useCallback((feature) => {
    const streetId = feature.properties?.street_id || feature.properties?.id;
    setHighlightId(streetId);
    
    // Optionnel : logger pour debug
    console.log('Feature cliquée:', feature.properties?.name || 'Rue sans nom');
  }, []);

  const handleClearHighlight = useCallback(() => {
    setHighlightId(null);
  }, []);

  const handleKPIChange = useCallback((kpi) => {
    setSelectedKPI(kpi);
  }, []);

  // ============================================================
  // RENDU CONDITIONNEL
  // ============================================================
  
  if (error) {
    return (
      <div className="error-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2 style={{ color: '#dc2626', marginTop: '16px' }}>Erreur de chargement</h2>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>{error}</p>
        <button 
          onClick={loadAllData}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (loading && !streetsData) {
    return <Loader fullScreen message="Chargement de la carte et des données..." />;
  }

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  
  return (
    <div className="home-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        filters={filters}
        onFilterChange={updateFilter}
        onFilterApply={applyFilters}
        onFilterReset={resetFilters}
        onClearHighlight={handleClearHighlight}
        kpiData={kpiData}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onKPIChange={handleKPIChange}
        selectedKPI={selectedKPI}
      />
      
      <main style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          streetsData={streetsData}
          arrondissementsData={arrondissementsData}
          wifiData={wifiData}
          antennesData={antennesData}
          kpiData={kpiData}
          onFeatureClick={handleFeatureClick}
          highlightId={highlightId}
          selectedKPI={selectedKPI}
          loading={loading}
        />
        
        {/* Indicateur de chargement en overlay (optionnel) */}
        {loading && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 10
          }}>
            Mise à jour des données...
          </div>
        )}
        
        {/* Indicateur de filtres actifs */}
        {hasActiveFilters && !loading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(59,130,246,0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            zIndex: 10,
            backdropFilter: 'blur(4px)'
          }}>
            🔍 Filtres actifs
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;