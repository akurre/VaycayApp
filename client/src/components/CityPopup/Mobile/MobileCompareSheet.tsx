import { useEffect, useState } from 'react';
import { ActionIcon, Loader, Modal, Text, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

import useCityComparisonSearch from '@/hooks/useCityComparisonSearch';
import CitySearchResultRow from '@/components/CityPopup/CitySearchResultRow';

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

  const {
    filteredResults,
    filteredRecent,
    isSearching,
    isLoading: isSearchLoading,
    pickCity,
  } = useCityComparisonSearch(searchTerm, excludeCity);

  useEffect(() => {
    if (!opened) {
      setSearchTerm('');
    }
  }, [opened]);

  const handlePick = (city: SearchCitiesResult) => {
    pickCity(city);
    onCitySelect(city);
    onClose();
  };

  const showSuggested = !isSearching && filteredRecent.length > 0;
  const showEmptyState = !isSearching && filteredRecent.length === 0;
  const noResults =
    isSearching && !isSearchLoading && filteredResults.length === 0;

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
              {filteredRecent.map((city) => (
                <li key={city.id}>
                  <CitySearchResultRow
                    city={city}
                    onClick={() => handlePick(city)}
                    variant="mobile"
                    showAddIcon
                  />
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

            {!isSearchLoading && filteredResults.length > 0 && (
              <ul className="list-none p-0 m-0">
                {filteredResults.map((city) => (
                  <li key={city.id}>
                    <CitySearchResultRow
                      city={city}
                      onClick={() => handlePick(city)}
                      variant="mobile"
                    />
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
