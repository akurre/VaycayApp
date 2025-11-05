import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_CITIES } from '@/api/queries';
import { SearchCitiesResult, HomeLocation, LocationSource } from '@/types/userLocationType';
import { useAppStore } from '@/stores/useAppStore';

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

  const searchCities = async (searchTerm: string): Promise<SearchCitiesResult[]> => {
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
      console.error('city search error:', err);
      return [];
    }
  };

  const selectCity = (city: SearchCitiesResult) => {
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
  };

  return {
    searchCities,
    selectCity,
    isLoading: loading,
    error: error?.message || null,
  };
}

export default useCitySearch;