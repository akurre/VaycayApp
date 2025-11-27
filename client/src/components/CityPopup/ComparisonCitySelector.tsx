import { useState, useEffect } from 'react';
import { TextInput, Popover, Loader, ActionIcon } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import useCitySearch from '@/hooks/useCitySearch';
import type { SearchCitiesResult } from '@/types/userLocationType';

interface ExcludeCity {
  name: string;
  state: string | null;
  country: string | null;
}

interface ComparisonCitySelectorProps {
  onCitySelect: (city: SearchCitiesResult) => void;
  onCityRemove: () => void;
  selectedCity: SearchCitiesResult | null;
  excludeCity?: ExcludeCity; // optional: exclude a city from search results (e.g., the main city)
}

const ComparisonCitySelector = ({
  onCitySelect,
  onCityRemove,
  selectedCity,
  excludeCity,
}: ComparisonCitySelectorProps) => {
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);

  const { searchCities, isLoading: isSearchLoading } = useCitySearch();

  // perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      searchCities(debouncedSearchTerm).then((results) => {
        // optionally filter out the excluded city by matching name, state, and country
        const filtered = excludeCity
          ? results.filter(
              (city) =>
                !(
                  city.name === excludeCity.name &&
                  city.state === excludeCity.state &&
                  city.country === excludeCity.country
                )
            )
          : results;
        setSearchResults(filtered);
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchCities, excludeCity]);

  const handleSelectCity = (city: SearchCitiesResult) => {
    onCitySelect(city);
    setSearchTerm('');
    setSearchResults([]);
    setOpened(false);
  };

  const handleRemoveCity = () => {
    onCityRemove();
    setSearchTerm('');
    setSearchResults([]);
    setOpened(false);
  };

  const handleInputClick = () => {
    if (selectedCity) {
      // Clear the input when clicking to change the city
      setSearchTerm('');
    }
    setOpened(true);
  };

  // Display selected city name in input, or search term when typing
  const displayValue =
    selectedCity && !opened
      ? `${selectedCity.name}${selectedCity.state ? `, ${selectedCity.state}` : ''}${selectedCity.country ? `, ${selectedCity.country}` : ''}`
      : searchTerm;

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <TextInput
          placeholder="Add city to compare..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            selectedCity ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCity();
                }}
                aria-label="Remove comparison city"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : undefined
          }
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.currentTarget.value);
            if (!opened) setOpened(true);
          }}
          onFocus={handleInputClick}
          onClick={handleInputClick}
          size="xs"
          className="w-64"
        />
      </Popover.Target>

      <Popover.Dropdown>
        <div className="w-80 p-2">
          {/* Search results */}
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
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm transition-colors"
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
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

          {searchTerm.trim().length < 2 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ComparisonCitySelector;
