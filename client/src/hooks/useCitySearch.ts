import { useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_CITIES } from '@/api/queries';
import type { SearchCitiesResult, HomeLocation } from '@/types/userLocationType';
import { LocationSource } from '@/types/userLocationType';
import { useAppStore } from '@/stores/useAppStore';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

interface UseCitySearchReturn {
  searchCities: (searchTerm: string) => Promise<SearchCitiesResult[]>;
  selectCity: (city: SearchCitiesResult) => void;
  isLoading: boolean;
  error: string | null;
}

function useCitySearch(): UseCitySearchReturn {
  const setHomeLocation = useAppStore((state) => state.setHomeLocation);

  const [searchQuery, { loading, error }] = useLazyQuery<{
    searchCities: SearchCitiesResult[];
  }>(SEARCH_CITIES);

  // wrap in usecallback to prevent infinite loops in components that use this function in useeffect dependencies
  const searchCities = useCallback(
    async (searchTerm: string): Promise<SearchCitiesResult[]> => {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      try {
        const { data } = await searchQuery({
          variables: {
            searchTerm: searchTerm.trim(),
            limit: 10,
          },
        });

        return data?.searchCities || [];
      } catch (err) {
        parseErrorAndNotify(err, 'failed to search cities');
        return [];
      }
    },
    [searchQuery]
  );

  // wrap in usecallback to maintain stable function reference across renders
  const selectCity = useCallback(
    (city: SearchCitiesResult) => {
      const homeLocation: HomeLocation = {
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        state: city.state,
        coordinates: {
          lat: city.lat,
          long: city.long,
        },
        source: LocationSource.Manual,
      };

      setHomeLocation(homeLocation);
    },
    [setHomeLocation]
  );

  return {
    searchCities,
    selectCity,
    isLoading: loading,
    error: error?.message || null,
  };
}

export default useCitySearch;
