import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconX } from '@tabler/icons-react';
import useCitySearch from '@/hooks/useCitySearch';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { CITY2_PRIMARY_COLOR, COMPARISON_INPUT_FOCUS_DELAY_MS } from '@/const';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import LatBadge from './Ribbon/LatBadge';

interface ExcludeCity {
  name: string;
  state: string | null;
  country: string | null;
}

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
  const [searchResults, setSearchResults] = useState<SearchCitiesResult[]>([]);
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const { searchCities, isLoading: isSearchLoading } = useCitySearch();

  useEffect(() => {
    if (debouncedSearchTerm.trim().length >= 2) {
      searchCities(debouncedSearchTerm)
        .then((results) => {
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
        .catch((error) =>
          parseErrorAndNotify(
            error,
            `failed to search cities for "${debouncedSearchTerm}"`
          )
        );
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchCities, excludeCity]);

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
    onCitySelect(city);
    setSearchTerm('');
    setSearchResults([]);
    setOpened(false);
  };

  const handleRemoveCity = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCityRemove();
    setSearchTerm('');
    setSearchResults([]);
    setOpened(false);
  };

  const fullName = useMemo(() => {
    if (!selectedCity) return '';
    return [selectedCity.name, selectedCity.state, selectedCity.country]
      .filter(Boolean)
      .join(', ');
  }, [selectedCity]);

  const latLabel =
    selectedCity !== null ? getClimateZoneFromLat(selectedCity.lat) : null;

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
            className="w-56 px-1 py-0.5 text-[15px] font-bold font-[Outfit] bg-transparent border-0 border-b text-[var(--mantine-color-text)] placeholder:text-[var(--mantine-color-dimmed)] placeholder:font-normal focus:outline-none"
            style={{ borderBottomColor: CITY2_PRIMARY_COLOR }}
          />
        ) : selectedCity ? (
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: CITY2_PRIMARY_COLOR }}
            />
            <h2
              className="text-[17px] font-bold font-[Outfit] text-[var(--mantine-color-text)] truncate min-w-0 cursor-pointer hover:opacity-80"
              title={fullName}
              onClick={() => setOpened(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setOpened(true);
              }}
            >
              {fullName}
            </h2>
            {latLabel && <LatBadge label={latLabel} />}
            <button
              type="button"
              onClick={handleRemoveCity}
              aria-label="Remove comparison city"
              className="ml-0.5 text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] cursor-pointer shrink-0"
            >
              <IconX size={14} />
            </button>
          </div>
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
            <span className="text-[17px] font-bold font-[Outfit]">Compare</span>
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
          {isSearchLoading && (
            <div className="flex justify-center py-3">
              <Loader size="xs" />
            </div>
          )}

          {!isSearchLoading && searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto py-1">
              {searchResults.map((city) => (
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
                    {city.population
                      ? ` • ${(city.population / 1_000_000).toFixed(1)}M`
                      : ''}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearchLoading &&
            searchTerm.trim().length >= 2 &&
            searchResults.length === 0 && (
              <div className="text-center py-3 text-xs text-[var(--mantine-color-dimmed)]">
                No cities found
              </div>
            )}

          {searchTerm.trim().length < 2 && (
            <div className="text-center py-3 text-xs text-[var(--mantine-color-dimmed)]">
              Type at least 2 characters
            </div>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default ComparisonCitySelector;
