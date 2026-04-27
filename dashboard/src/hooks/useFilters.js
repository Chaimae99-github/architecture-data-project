import { useState, useCallback, useMemo } from 'react';

/**
 * Hook pour la gestion des filtres
 * @param {Object} initialFilters - Filtres initiaux
 * @returns {Object} { filters, activeFilters, updateFilter, applyFilters, resetFilters, removeFilter }
 */
export const useFilters = (initialFilters = {}) => {
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setDraftFilters(prev => ({
      ...prev,
      [key]: value === '' || value === null ? undefined : value,
    }));
  }, []);

  const applyFilters = useCallback(() => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(draftFilters).filter(([_, v]) => v !== undefined && v !== '')
    );
    setActiveFilters(cleanedFilters);
  }, [draftFilters]);

  const resetFilters = useCallback(() => {
    setDraftFilters(initialFilters);
    setActiveFilters(initialFilters);
  }, [initialFilters]);

  const removeFilter = useCallback((key) => {
    setDraftFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setActiveFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFilters).length > 0;
  }, [activeFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(activeFilters).length;
  }, [activeFilters]);

  return {
    filters: draftFilters,
    activeFilters,
    updateFilter,
    applyFilters,
    resetFilters,
    removeFilter,
    hasActiveFilters,
    activeFiltersCount,
  };
};

export default useFilters;