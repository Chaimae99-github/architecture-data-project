import { useState, useEffect, useCallback } from 'react';
import { getKPI, getKPIByArrondissement, getKPIComparison, getKPITimeline } from '../api/getKPI';

/**
 * Hook pour la gestion des indicateurs clés (KPI)
 */
export const useKPI = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArrondissement, setSelectedArrondissement] = useState(null);
  const [arrondissementData, setArrondissementData] = useState(null);

  // Chargement initial des KPI globaux
  useEffect(() => {
    const fetchKPI = async () => {
      try {
        setLoading(true);
        const data = await getKPI();
        setKpiData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching KPI:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPI();
  }, []);

  // Récupérer les KPI d'un arrondissement spécifique
  const fetchByArrondissement = useCallback(async (arrondissement, year = null) => {
    if (!arrondissement) return null;
    
    try {
      setLoading(true);
      const data = await getKPIByArrondissement(arrondissement, year);
      setArrondissementData(data);
      setSelectedArrondissement(arrondissement);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Comparer deux arrondissements
  const fetchComparison = useCallback(async (arr1, arr2, kpi) => {
    if (!arr1 || !arr2 || !kpi) return null;
    
    try {
      setLoading(true);
      const data = await getKPIComparison(arr1, arr2, kpi);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer la timeline d'un KPI
  const fetchTimeline = useCallback(async (kpi, arrondissement = null) => {
    if (!kpi) return null;
    
    try {
      setLoading(true);
      const data = await getKPITimeline(kpi, arrondissement);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    kpiData,
    loading,
    error,
    selectedArrondissement,
    arrondissementData,
    fetchByArrondissement,
    fetchComparison,
    fetchTimeline,
  };
};

export default useKPI;