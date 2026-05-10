import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import useCitySearch from '@/hooks/useCitySearch';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { CITY_SEARCH_DEBOUNCE_MS, MIN_CITY_SEARCH_LENGTH } from '@/const';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

interface UseCityComparisonSearchReturn {
  results: SearchCitiesResult[];
  isLoading: boolean;
}

// Debounced city search for the compare popover/sheet. Callers apply their
// own excludeCity filter as derived state — keeping it out of the effect deps
// avoids the abort-storm where a fresh excludeCity object identity from the
// parent would re-fire the search and cancel the in-flight request.
function useCityComparisonSearch(
  searchTerm: string
): UseCityComparisonSearchReturn {
  const [results, setResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(
    searchTerm,
    CITY_SEARCH_DEBOUNCE_MS
  );
  const { searchCities, isLoading } = useCitySearch();

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

  return { results, isLoading };
}

export default useCityComparisonSearch;
