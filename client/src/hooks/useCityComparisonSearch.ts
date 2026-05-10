import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import useCitySearch from '@/hooks/useCitySearch';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';
import type { SearchCitiesResult } from '@/types/userLocationType';
import type { ExcludeCity } from '@/types/cityPopupTypes';
import { CITY_SEARCH_DEBOUNCE_MS, MIN_CITY_SEARCH_LENGTH } from '@/const';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

interface UseCityComparisonSearchReturn {
  filteredResults: SearchCitiesResult[];
  filteredRecent: SearchCitiesResult[];
  isSearching: boolean;
  isLoading: boolean;
  pickCity: (city: SearchCitiesResult) => void;
}

// Debounced city search for compare UIs. excludeCity is applied as derived
// state, kept out of the effect deps so a fresh object identity from the parent doesn't abort the in-flight request.
function useCityComparisonSearch(
  searchTerm: string,
  excludeCity?: ExcludeCity
): UseCityComparisonSearchReturn {
  const [results, setResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(
    searchTerm,
    CITY_SEARCH_DEBOUNCE_MS
  );
  const { searchCities, isLoading } = useCitySearch();
  const recentCities = useRecentCitiesStore((s) => s.recentCities);
  const pushRecentCity = useRecentCitiesStore((s) => s.pushRecentCity);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length < MIN_CITY_SEARCH_LENGTH) {
      setResults([]);
      return undefined;
    }

    let cancelled = false;
    searchCities(debouncedSearchTerm)
      .then((next) => {
        if (cancelled) return;
        setResults(next);
      })
      .catch((error) => {
        if (cancelled) return;
        parseErrorAndNotify(
          error,
          `failed to search cities for "${debouncedSearchTerm}"`
        );
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, searchCities]);

  const isExcluded = (city: SearchCitiesResult): boolean =>
    excludeCity != null &&
    city.name === excludeCity.name &&
    city.state === excludeCity.state &&
    city.country === excludeCity.country;

  const filteredResults = excludeCity
    ? results.filter((city) => !isExcluded(city))
    : results;
  const filteredRecent = excludeCity
    ? recentCities.filter((city) => !isExcluded(city))
    : recentCities;

  const isSearching = searchTerm.trim().length >= MIN_CITY_SEARCH_LENGTH;

  return {
    filteredResults,
    filteredRecent,
    isSearching,
    isLoading,
    pickCity: pushRecentCity,
  };
}

export default useCityComparisonSearch;
