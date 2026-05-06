import { Loader, Text } from '@mantine/core';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { MIN_CITY_SEARCH_LENGTH } from '@/const';
import HomeLocationSearchResult from '@/components/Navigation/HomeLocationSearchResult';

interface HomeLocationSearchResultsProps {
  results: SearchCitiesResult[];
  isLoading: boolean;
  searchTerm: string;
  onSelect: (city: SearchCitiesResult) => void;
}

const HomeLocationSearchResults = ({
  results,
  isLoading,
  searchTerm,
  onSelect,
}: HomeLocationSearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader size="sm" />
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
        {results.map((city) => (
          <HomeLocationSearchResult
            key={city.id}
            city={city}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  if (searchTerm.trim().length >= MIN_CITY_SEARCH_LENGTH) {
    return (
      <Text size="sm" c="dimmed" ta="center" className="py-4">
        No cities found
      </Text>
    );
  }

  return null;
};

export default HomeLocationSearchResults;
