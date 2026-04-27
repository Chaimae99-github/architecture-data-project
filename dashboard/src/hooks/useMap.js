import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Configuration Mapbox (à remplacer par votre token)
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

/**
 * Hook pour l'initialisation et le contrôle de la carte Mapbox
 * @param {string} containerId - ID du conteneur HTML
 * @param {Object} options - Options de configuration
 */
export const useMap = (containerId, options = {}) => {
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef(null);

  const defaultOptions = {
    center: [2.3522, 48.8566],
    zoom: 12,
    minZoom: 10,
    maxZoom: 18,
    style: 'mapbox://styles/mapbox/light-v11',
    ...options,
  };

  useEffect(() => {
    if (mapRef.current || !containerId) return;

    const mapInstance = new mapboxgl.Map({
      container: containerId,
      ...defaultOptions,
    });

    mapInstance.on('load', () => {
      setIsLoaded(true);
    });

    mapRef.current = mapInstance;
    setMap(mapInstance);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId]);

  // Ajouter une source
  const addSource = useCallback((id, source) => {
    if (mapRef.current && !mapRef.current.getSource(id)) {
      mapRef.current.addSource(id, source);
      return true;
    }
    return false;
  }, []);

  // Mettre à jour une source
  const updateSource = useCallback((id, data) => {
    if (mapRef.current && mapRef.current.getSource(id)) {
      mapRef.current.getSource(id).setData(data);
      return true;
    }
    return false;
  }, []);

  // Ajouter une couche
  const addLayer = useCallback((layer, beforeId = null) => {
    if (mapRef.current && !mapRef.current.getLayer(layer.id)) {
      if (beforeId) {
        mapRef.current.addLayer(layer, beforeId);
      } else {
        mapRef.current.addLayer(layer);
      }
      return true;
    }
    return false;
  }, []);

  // Supprimer une couche
  const removeLayer = useCallback((id) => {
    if (mapRef.current && mapRef.current.getLayer(id)) {
      mapRef.current.removeLayer(id);
      return true;
    }
    return false;
  }, []);

  // Supprimer une source
  const removeSource = useCallback((id) => {
    if (mapRef.current && mapRef.current.getSource(id)) {
      mapRef.current.removeSource(id);
      return true;
    }
    return false;
  }, []);

  // Voler vers des coordonnées
  const flyTo = useCallback((coordinates, zoom = 15, duration = 1500) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: coordinates, zoom, duration });
    }
  }, []);

  // Ajuster la vue sur une bounding box
  const fitBounds = useCallback((bounds, padding = 50) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding });
    }
  }, []);

  // Filtrer une couche
  const setFilter = useCallback((layerId, filter) => {
    if (mapRef.current && mapRef.current.getLayer(layerId)) {
      mapRef.current.setFilter(layerId, filter);
    }
  }, []);

  // Définir la peinture d'une couche
  const setPaintProperty = useCallback((layerId, property, value) => {
    if (mapRef.current && mapRef.current.getLayer(layerId)) {
      mapRef.current.setPaintProperty(layerId, property, value);
    }
  }, []);

  return {
    map,
    isLoaded,
    addSource,
    updateSource,
    addLayer,
    removeLayer,
    removeSource,
    flyTo,
    fitBounds,
    setFilter,
    setPaintProperty,
  };
};

export default useMap;