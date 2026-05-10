import { useEffect, useRef, useState } from 'react';
import { Popover, Loader } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import useCityComparisonSearch from '@/hooks/useCityComparisonSearch';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { PopupVariant, type ExcludeCity } from '@/types/cityPopupTypes';
import {
  CITY2_PRIMARY_COLOR,
  COMPARISON_INPUT_FOCUS_DELAY_MS,
  MIN_CITY_SEARCH_LENGTH,
} from '@/const';
import formatCityFullName from '@/utils/dataFormatting/formatCityFullName';
import CityNameRow from '@/components/CityPopup/Ribbon/CityNameRow';
import CitySearchResultRow from '@/components/CityPopup/CitySearchResultRow';
import AddComparisonCityButton from '@/components/CityPopup/AddComparisonCityButton';

interface ComparisonCitySelectorProps {
  onCitySelect: (city: SearchCitiesResult) => void;
  onCityRemove: () => void;
  selectedCity: SearchCitiesResult | null;
  excludeCity?: ExcludeCity;
}

const ComparisonCitySelector = ({
  onCitySelect,
  onCityRemove,
  selectedCity,
  excludeCity,
}: ComparisonCitySelectorProps) => {
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    filteredResults,
    filteredRecent,
    isSearching,
    isLoading: isSearchLoading,
    pickCity,
  } = useCityComparisonSearch(searchTerm, excludeCity);

  useEffect(() => {
    if (opened) {
      const id = window.setTimeout(
        () => inputRef.current?.focus(),
        COMPARISON_INPUT_FOCUS_DELAY_MS
      );
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [opened]);

  const handleSelectCity = (city: SearchCitiesResult) => {
    pickCity(city);
    onCitySelect(city);
    setSearchTerm('');
    setOpened(false);
  };

  const handleRemoveCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCityRemove();
    setSearchTerm('');
    setOpened(false);
  };

  const fullName = selectedCity ? formatCityFullName(selectedCity) : '';

  const showSuggested = !isSearching && filteredRecent.length > 0;
  const showSearchPrompt = !isSearching && filteredRecent.length === 0;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      offset={6}
      shadow="md"
      transitionProps={{ duration: 120 }}
    >
      <Popover.Target>
        {opened ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            onBlur={() => {
              // close only if user didn't open the dropdown — the dropdown
              // mousedown handler will preempt this for selection clicks
              if (!searchTerm) setOpened(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpened(false);
            }}
            placeholder="Compare a city…"
            aria-label="Search comparison city"
            className="w-56 px-1 py-0.5 text-[15px] font-bold font-[Outfit_Variable] bg-transparent border-0 border-b text-[var(--mantine-color-text)] placeholder:text-[var(--mantine-color-dimmed)] placeholder:font-normal focus:outline-none"
            style={{ borderBottomColor: CITY2_PRIMARY_COLOR }}
          />
        ) : selectedCity ? (
          <CityNameRow
            color={CITY2_PRIMARY_COLOR}
            name={fullName}
            lat={selectedCity.lat}
            onClick={() => setOpened(true)}
            actions={
              <button
                type="button"
                onClick={handleRemoveCity}
                aria-label="Remove comparison city"
                className="ml-0.5 text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] cursor-pointer shrink-0"
              >
                <IconX size={14} />
              </button>
            }
          />
        ) : (
          <AddComparisonCityButton
            onClick={() => setOpened(true)}
            variant={PopupVariant.Desktop}
          />
        )}
      </Popover.Target>

      <Popover.Dropdown
        p={0}
        styles={{
          dropdown: {
            backgroundColor: 'var(--mantine-color-default-hover)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 6,
          },
        }}
        // keep mousedown selections from triggering the input's onBlur
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="w-72">
          {showSuggested && (
            <div className="max-h-60 overflow-y-auto py-1">
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--mantine-color-dimmed)]">
                Suggested
              </div>
              {filteredRecent.map((city) => (
                <CitySearchResultRow
                  key={city.id}
                  city={city}
                  onClick={() => handleSelectCity(city)}
                  variant={PopupVariant.Desktop}
                />
              ))}
            </div>
          )}

          {showSearchPrompt && (
            <div className="text-center py-3 text-xs text-[var(--mantine-color-dimmed)]">
              Type at least {MIN_CITY_SEARCH_LENGTH} characters
            </div>
          )}

          {isSearching && isSearchLoading && (
            <div className="flex justify-center py-3">
              <Loader size="xs" />
            </div>
          )}

          {isSearching && !isSearchLoading && filteredResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredResults.map((city) => (
                <CitySearchResultRow
                  key={city.id}
                  city={city}
                  onClick={() => handleSelectCity(city)}
                  variant={PopupVariant.Desktop}
                />
              ))}
            </div>
          )}

          {isSearching && !isSearchLoading && filteredResults.length === 0 && (
            <div className="text-center py-3 text-xs text-[var(--mantine-color-dimmed)]">
              No cities found
            </div>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ComparisonCitySelector;
