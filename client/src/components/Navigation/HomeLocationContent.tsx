import { useState, useEffect } from 'react';
import { Button, TextInput, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconMapPin, IconSearch } from '@tabler/icons-react';
import { useUserLocation } from '@/hooks/useUserLocation';
import useCitySearch from '@/hooks/useCitySearch';
import useGlassTokens from '@/hooks/useGlassTokens';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { CITY_SEARCH_DEBOUNCE_MS, MIN_CITY_SEARCH_LENGTH } from '@/const';
import HomeLocationSearchResults from '@/components/Navigation/HomeLocationSearchResults';
import { secondaryOceanShades } from '@/theme';

const HomeLocationContent = () => {
  const glass = useGlassTokens();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(
    searchTerm,
    CITY_SEARCH_DEBOUNCE_MS
  );

  const { requestLocation, isLoading: isGeoLoading } = useUserLocation();
  const {
    searchCities,
    selectCity,
    isLoading: isSearchLoading,
  } = useCitySearch();

  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= MIN_CITY_SEARCH_LENGTH) {
      searchCities(debouncedSearchTerm).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchCities]);

  const handleUseMyLocation = async () => {
    await requestLocation();
  };

  const handleSelectCity = (city: SearchCitiesResult) => {
    selectCity(city);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleUseMyLocation}
        leftSection={<IconMapPin size={16} />}
        variant="light"
        fullWidth
        color={secondaryOceanShades[2]}
        size="xs"
        loading={isGeoLoading}
        className="mb-3"
      >
        Use My Current Location
      </Button>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px" style={{ background: glass.divider }} />
        <Text size="xs" c="dimmed">
          OR
        </Text>
        <div className="flex-1 h-px" style={{ background: glass.divider }} />
      </div>

      <TextInput
        placeholder="Search for a city..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        className="mb-2"
      />

      <HomeLocationSearchResults
        results={searchResults}
        isLoading={isSearchLoading}
        searchTerm={searchTerm}
        onSelect={handleSelectCity}
      />
    </div>
  );
};

export default HomeLocationContent;
