import { useEffect, useState } from 'react';
import { ActionIcon, Loader, Modal, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';

import useCitySearch from '@/hooks/useCitySearch';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { CITY_SEARCH_DEBOUNCE_MS, MIN_CITY_SEARCH_LENGTH } from '@/const';

import type { SearchCitiesResult } from '@/types/userLocationType';
import type { ExcludeCity } from '@/types/cityPopupTypes';

interface MobileCompareSheetProps {
  opened: boolean;
  onClose: () => void;
  onCitySelect: (city: SearchCitiesResult) => void;
  excludeCity?: ExcludeCity;
}

const MobileCompareSheet = ({
  opened,
  onClose,
  onCitySelect,
  excludeCity,
}: MobileCompareSheetProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(
    searchTerm,
    CITY_SEARCH_DEBOUNCE_MS
  );

  const { searchCities, isLoading: isSearchLoading } = useCitySearch();
  const recentCities = useRecentCitiesStore((s) => s.recentCities);
  const pushRecentCity = useRecentCitiesStore((s) => s.pushRecentCity);

  useEffect(() => {
    if (debouncedSearchTerm.trim().length < MIN_CITY_SEARCH_LENGTH) {
      setSearchResults([]);
      return undefined;
    }

    let cancelled = false;
    searchCities(debouncedSearchTerm)
      .then((results) => {
        if (cancelled) return;
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
  }, [debouncedSearchTerm, searchCities, excludeCity]);

  useEffect(() => {
    if (!opened) {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [opened]);

  const handlePick = (city: SearchCitiesResult) => {
    pushRecentCity(city);
    onCitySelect(city);
    onClose();
  };

  const trimmedSearch = searchTerm.trim();
  const isSearching = trimmedSearch.length >= MIN_CITY_SEARCH_LENGTH;
  const showSuggested = !isSearching && recentCities.length > 0;
  const showEmptyState = !isSearching && recentCities.length === 0;
  const noResults =
    isSearching && !isSearchLoading && searchResults.length === 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      withCloseButton={false}
      overlayProps={{ opacity: 0.4, blur: 2 }}
      padding={0}
      radius="lg"
      size="md"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Text fw={700} size="md">
          Compare a city
        </Text>
        <ActionIcon
          onClick={onClose}
          aria-label="Close compare sheet"
          variant="subtle"
          size="md"
        >
          <IconX size={18} />
        </ActionIcon>
      </div>

      <div className="px-4 pb-2">
        <TextInput
          placeholder="Search a city to compare…"
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          aria-label="Search a city to compare"
          autoFocus
        />
      </div>

      <div className="px-2 pb-3 max-h-[60vh] overflow-y-auto">
        {showEmptyState && (
          <div className="text-center py-6 px-3">
            <Text size="sm" c="dimmed">
              Search for a city to compare.
            </Text>
          </div>
        )}

        {showSuggested && (
          <>
            <Text size="xs" c="dimmed" px="sm" py="xs" fw={600}>
              Suggested
            </Text>
            <ul className="list-none p-0 m-0">
              {recentCities.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(city)}
                    className="w-full flex items-center justify-between text-left px-3 py-3 rounded-md transition-colors hover:bg-[var(--mantine-color-default-hover)] cursor-pointer"
                  >
                    <span className="min-w-0 flex-1 mr-2">
                      <span className="block font-bold text-[15px] text-[var(--mantine-color-text)] truncate">
                        {city.name}
                      </span>
                      <span className="block text-xs text-[var(--mantine-color-dimmed)] truncate">
                        {city.state ? `${city.state}, ` : ''}
                        {city.country}
                      </span>
                    </span>
                    <IconPlus
                      size={16}
                      className="opacity-60 shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {isSearching && (
          <>
            {isSearchLoading && (
              <div className="flex justify-center py-4">
                <Loader size="sm" />
              </div>
            )}

            {!isSearchLoading && searchResults.length > 0 && (
              <ul className="list-none p-0 m-0">
                {searchResults.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(city)}
                      className="w-full text-left px-3 py-3 rounded-md transition-colors hover:bg-[var(--mantine-color-default-hover)] cursor-pointer"
                    >
                      <span className="block font-bold text-[15px] text-[var(--mantine-color-text)] truncate">
                        {city.name}
                      </span>
                      <span className="block text-xs text-[var(--mantine-color-dimmed)] truncate">
                        {city.state ? `${city.state}, ` : ''}
                        {city.country}
                        {city.population
                          ? ` • ${(city.population / 1_000_000).toFixed(1)}M`
                          : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {noResults && (
              <div className="text-center py-4 px-3">
                <Text size="sm" c="dimmed">
                  No cities found
                </Text>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default MobileCompareSheet;
