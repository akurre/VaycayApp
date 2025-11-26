import { useState, useEffect } from 'react';
import { Button, TextInput, Popover, Loader, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconHome, IconMapPin, IconSearch } from '@tabler/icons-react';
import { useAppStore } from '@/stores/useAppStore';
import { useUserLocation } from '@/hooks/useUserLocation';
import useCitySearch from '@/hooks/useCitySearch';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { TOGGLE_ICON_SIZE } from '@/const';

const HomeLocationSelector = () => {
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);

  const homeLocation = useAppStore((state) => state.homeLocation);
  const { requestLocation, isLoading: isGeoLoading } = useUserLocation();
  const { searchCities, selectCity, isLoading: isSearchLoading } = useCitySearch();

  // perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      searchCities(debouncedSearchTerm).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchCities]);

  const handleUseMyLocation = async () => {
    await requestLocation();
    setOpened(false);
  };

  const handleSelectCity = (city: SearchCitiesResult) => {
    selectCity(city);
    setSearchTerm('');
    setSearchResults([]);
    setOpened(false);
  };

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Button
          onClick={() => setOpened((o) => !o)}
          leftSection={<IconHome size={TOGGLE_ICON_SIZE} />}
          size="xs"
        >
          {homeLocation ? `${homeLocation.cityName}, ${homeLocation.country}` : 'Set Home Location'}
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <div className="w-80 p-2">
          <div className="text-sm mb-3">
            <Text>Set Your Home Location</Text>
          </div>

          {/* use my location button */}
          <Button
            onClick={handleUseMyLocation}
            leftSection={<IconMapPin size={16} />}
            variant="light"
            fullWidth
            size="xs"
            loading={isGeoLoading}
            className="mb-3"
          >
            Use My Current Location
          </Button>

          {/* divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* search input */}
          <TextInput
            placeholder="Search for a city..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            className="mb-2"
          />

          {/* search results */}
          {isSearchLoading && (
            <div className="flex justify-center py-4">
              <Loader size="sm" />
            </div>
          )}

          {!isSearchLoading && searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm transition-colors"
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-600">
                    {city.state && `${city.state}, `}
                    {city.country}
                    {city.population && ` • ${(city.population / 1000000).toFixed(1)}M`}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearchLoading && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">No cities found</div>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default HomeLocationSelector;
