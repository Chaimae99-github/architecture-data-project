// MapContainer.jsx - Version complète avec toutes les couches
import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG, MAP_STYLE } from './mapConfig';

const MapContainer = ({ 
  streetsData,      // GeoJSON des rues
  arrondissementsData, // GeoJSON des arrondissements
  wifiData,         // GeoJSON des points Wi-Fi
  antennesData,     // GeoJSON des antennes
  onFeatureClick,
  highlightId
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. INITIALISATION
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      maxBounds: MAP_CONFIG.maxBounds
    });

    // Contrôles
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Popup
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px',
      offset: 25
    });

    map.current.on('load', () => {
      console.log('✅ Carte chargée');
      setIsLoaded(true);
    });

    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  // 2. COUCHE DES ARRONDISSEMENTS (choroplèthe)
  useEffect(() => {
    if (!isLoaded || !map.current || !arrondissementsData) return;

    const sourceId = 'arrondissements';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(arrondissementsData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: arrondissementsData
      });

      // Couche des polygones (colorée selon le prix)
      map.current.addLayer({
        id: 'arrondissements-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'prix_m2_median'],
            0, '#fee5d9',
            5000, '#fcae91',
            10000, '#fb6a4a',
            15000, '#de2d26',
            20000, '#a50f15'
          ],
          'fill-opacity': 0.6,
          'fill-outline-color': '#ffffff'
        }
      });

      // Couche des contours
      map.current.addLayer({
        id: 'arrondissements-outline',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#2c3e50',
          'line-width': 1.5,
          'line-opacity': 0.5
        }
      });
    }

    // Clic sur un arrondissement
    map.current.on('click', 'arrondissements-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;
        const coords = e.lngLat;
        
        popup.current
          .setLngLat(coords)
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px 0;">${props.l_ar || `Paris ${props.c_ar}ème`}</h3>
              <p><strong>💰 Prix au m² :</strong> ${props.prix_m2_median?.toLocaleString()} €</p>
              <p><strong>🏠 Logements sociaux :</strong> ${props.logements_sociaux_pct || 0}%</p>
              <p><strong>📶 Hotspots Wi-Fi :</strong> ${props.wifi_count || 0}</p>
            </div>
          `)
          .addTo(map.current);
        
        if (onFeatureClick) onFeatureClick(feature);
      }
    });

  }, [isLoaded, arrondissementsData, onFeatureClick]);

  // 3. COUCHE DES RUES
  useEffect(() => {
    if (!isLoaded || !map.current || !streetsData) return;

    const sourceId = 'streets';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(streetsData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: streetsData
      });

      map.current.addLayer({
        id: 'streets-layer',
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
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
            '#D3D3D3'
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1,
            14, 2,
            18, 3
          ],
          'line-opacity': 0.8
        }
      });
    }

    // Survol
    map.current.on('mouseenter', 'streets-layer', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'streets-layer', () => {
      map.current.getCanvas().style.cursor = '';
    });

    // Clic
    map.current.on('click', 'streets-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties;
        const coords = e.lngLat;
        
        popup.current
          .setLngLat(coords)
          .setHTML(`
            <div style="padding: 10px;">
              <h3 style="margin: 0 0 8px 0;">${props.name || 'Rue sans nom'}</h3>
              <p><strong>Type :</strong> ${props.type || 'Non spécifié'}</p>
              <p><strong>Arrondissement :</strong> ${props.arrondissement}ème</p>
              <p><strong>Longueur :</strong> ${(props.length_km || 0).toFixed(2)} km</p>
            </div>
          `)
          .addTo(map.current);
        
        if (onFeatureClick) onFeatureClick(feature);
      }
    });

  }, [isLoaded, streetsData, onFeatureClick]);

  // 4. COUCHE DES POINTS WI-FI (avec clustering)
  useEffect(() => {
    if (!isLoaded || !map.current || !wifiData) return;

    const sourceId = 'wifi';
    
    if (map.current.getSource(sourceId)) {
      map.current.getSource(sourceId).setData(wifiData);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: wifiData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Clusters
      map.current.addLayer({
        id: 'wifi-clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10, '#f1f075',
            30, '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10, 30,
            30, 40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Points individuels
      map.current.addLayer({
        id: 'wifi-points',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 6,
          'circle-color': '#00BFFF',
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    // Clic sur cluster (zoom)
    map.current.on('click', 'wifi-clusters', (e) => {
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['wifi-clusters'] });
      const clusterId = features[0].properties.cluster_id;
      const source = map.current.getSource('wifi');
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.current.easeTo({ center: features[0].geometry.coordinates, zoom });
      });
    });

  }, [isLoaded, wifiData]);

  // 5. HIGHLIGHT DE RUE
  useEffect(() => {
    if (!isLoaded || !map.current || !map.current.getLayer('streets-layer')) return;
    
    if (highlightId) {
      if (!map.current.getLayer('highlight-layer')) {
        map.current.addLayer({
          id: 'highlight-layer',
          type: 'line',
          source: 'streets',
          paint: {
            'line-color': '#FFD700',
            'line-width': 5,
            'line-opacity': 1
          },
          filter: ['==', 'street_id', highlightId]
        });
      } else {
        map.current.setFilter('highlight-layer', ['==', 'street_id', highlightId]);
      }
    }
  }, [isLoaded, highlightId]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100vh' }}
      className="map-container"
    />
  );
};

export default MapContainer;