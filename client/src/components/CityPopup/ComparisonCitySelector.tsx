import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Loader } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import useCityComparisonSearch from '@/hooks/useCityComparisonSearch';
import type { SearchCitiesResult } from '@/types/userLocationType';
import type { ExcludeCity } from '@/types/cityPopupTypes';
import {
  CITY2_PRIMARY_COLOR,
  COMPARISON_INPUT_FOCUS_DELAY_MS,
  MIN_CITY_SEARCH_LENGTH,
} from '@/const';
import { formatCityPopulationSuffix } from '@/utils/dataFormatting/formatCityPopulationSuffix';
import CityNameRow from '@/components/CityPopup/Ribbon/CityNameRow';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';

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

  const { results, isLoading: isSearchLoading } =
    useCityComparisonSearch(searchTerm);
  const recentCities = useRecentCitiesStore((s) => s.recentCities);
  const pushRecentCity = useRecentCitiesStore((s) => s.pushRecentCity);

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
    pushRecentCity(city);
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

  const fullName = useMemo(() => {
    if (!selectedCity) return '';
    return [selectedCity.name, selectedCity.state, selectedCity.country]
      .filter(Boolean)
      .join(', ');
  }, [selectedCity]);

  const isExcluded = (city: SearchCitiesResult): boolean =>
    excludeCity != null &&
    city.name === excludeCity.name &&
    city.state === excludeCity.state &&
    city.country === excludeCity.country;

  const filteredResults = excludeCity
    ? results.filter((city) => !isExcluded(city))
    : results;
  const filteredRecent = excludeCity
    ? recentCities.filter((city) => !isExcluded(city))
    : recentCities;

  const trimmedSearch = searchTerm.trim();
  const isSearching = trimmedSearch.length >= MIN_CITY_SEARCH_LENGTH;
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
          <button
            type="button"
            onClick={() => setOpened(true)}
            aria-label="Add comparison city"
            className="flex items-center gap-2 min-w-0 cursor-pointer text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] transition-colors"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 opacity-60"
              style={{ background: CITY2_PRIMARY_COLOR }}
            />
            <span className="text-[17px] font-bold font-[Outfit_Variable]">
              Compare
            </span>
            <IconPlus size={14} className="opacity-70 shrink-0" />
          </button>
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
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--mantine-color-default-border)] cursor-pointer"
                >
                  <div className="font-medium text-[var(--mantine-color-text)]">
                    {city.name}
                  </div>
                  <div className="text-xs text-[var(--mantine-color-dimmed)]">
                    {city.state && `${city.state}, `}
                    {city.country}
                    {formatCityPopulationSuffix(city.population)}
                  </div>
                </button>
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
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--mantine-color-default-border)] cursor-pointer"
                >
                  <div className="font-medium text-[var(--mantine-color-text)]">
                    {city.name}
                  </div>
                  <div className="text-xs text-[var(--mantine-color-dimmed)]">
                    {city.state && `${city.state}, `}
                    {city.country}
                    {formatCityPopulationSuffix(city.population)}
                  </div>
                </button>
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
