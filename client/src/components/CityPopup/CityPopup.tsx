import { ActionIcon, Button, Popover, Title, Text } from '@mantine/core';
import { useMemo, memo } from 'react';
import { IconX } from '@tabler/icons-react';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import type { WeatherDataUnion } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import WeatherDataSection from './WeatherDataSection';
import AdditionalInfo from './AdditionalInfo';
import DataChartTabs from './DataChartTabs';
import Field from './Field';
import GreaterSection from './GreaterSection';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';
import { isWeatherData } from '@/utils/typeGuards';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';
import getSunshineHoursIcon from '@/utils/iconMapping/getSunshineIcon';

interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth: number;
  selectedDate?: string;
}

const CityPopup = ({ city, onClose, selectedMonth, selectedDate }: CityPopupProps) => {
  // Determine what type of data we have
  const hasWeatherData = city && isWeatherData(city);
  const hasSunshineData = city && !isWeatherData(city);

  const cityAsWeather = hasWeatherData ? city : null;
  const cityAsSunshine = hasSunshineData ? city : null;

  // Determine the month to use with validation
  // Prefer selectedMonth from parent, fall back to extracting from weather data
  const monthToUse =
    selectedMonth ?? extractMonthFromDate(cityAsWeather?.date) ?? new Date().getMonth() + 1;

  // Construct the date for weather fetching - clearer logic
  const dateToUse = useMemo(() => {
    // If we have weather data, use its date
    if (cityAsWeather?.date) {
      return cityAsWeather.date;
    }

    // For temperature mode with selected date, use it
    if (selectedDate && hasWeatherData) {
      return selectedDate;
    }

    // For sunshine mode, construct mm-15 format from month
    return `${monthToUse.toString().padStart(2, '0')}-15`;
  }, [cityAsWeather, selectedDate, hasWeatherData, monthToUse]);

  // Determine if we should fetch weather data
  // Fetch when: we don't have weather data and we have a valid date
  const shouldFetchWeather = !hasWeatherData && !!dateToUse;

  // always call hooks unconditionally (rules of hooks)
  const { weatherData, weatherLoading, weatherError } = useWeatherDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    selectedDate: dateToUse,
    skipFetch: !shouldFetchWeather,
  });

  // determine if we should fetch sunshine data
  // fetch when: we don't have sunshine data and we have a valid month
  const shouldFetchSunshine = !hasSunshineData && monthToUse >= 1 && monthToUse <= 12;

  const { sunshineData, sunshineLoading, sunshineError } = useSunshineDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    skipFetch: !shouldFetchSunshine,
  });

  // use what we already have, or fall back to fetched data
  const displayWeatherData = cityAsWeather ?? weatherData;
  const displaySunshineData = cityAsSunshine ?? sunshineData;

  // Calculate average sunshine if we have sunshine data
  const averageSunshine = useMemo(() => {
    if (!displaySunshineData) return null;
    const chartData = transformSunshineDataForChart(displaySunshineData);
    return calculateAverageSunshine(chartData);
  }, [displaySunshineData]);

  // early return AFTER all hooks have been called
  if (!city) return null;

  // Get the sunshine icon
  const SunshineIcon = getSunshineHoursIcon(averageSunshine);

  // Create the modal title
  let cityAndCountry = toTitleCase(city.city);
  if (city.state) {
    cityAndCountry += `, ${toTitleCase(city.state)}`;
  }
  cityAndCountry += `, ${city.country}`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 shadow-lg z-50 flex flex-col"
      style={{
        height: '33.333vh',
        pointerEvents: 'auto',
        backgroundColor: 'var(--mantine-color-body)',
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <div className="absolute top-2 right-2 z-10">
        {/* close button */}
        <ActionIcon onClick={onClose} aria-label="Close">
          <IconX size={24} />
        </ActionIcon>
      </div>
      {/* Content area with horizontal layout */}
      <div className="flex h-full overflow-hidden">
        {/* Left section - City info and metadata */}
        <div className="flex flex-col gap-3 px-6 py-4 h-full min-w-1/2 overflow-y-auto">
          <div className="flex w-full">
            <div className="flex gap-4 items-center">
              <Title order={4}>{cityAndCountry}</Title>
              <Popover position="top" withArrow shadow="md">
                <Popover.Target>
                  <Button variant="subtle" size="compact-xs">
                    More Info
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  {city.stationName && (
                    <div>
                      <Field label="Weather Station" value={city.stationName} />
                    </div>
                  )}
                  {city.lat && city.long && (
                    <Field
                      label="Coordinates"
                      value={`${city.lat.toFixed(4)}°, ${city.long.toFixed(4)}°`}
                      monospace
                    />
                  )}
                </Popover.Dropdown>
              </Popover>
            </div>
          </div>
          <div className="flex gap-10">
            <AdditionalInfo city={city} />

            {/* Middle section - Weather data */}
            <div className="flex flex-col">
              <WeatherDataSection
                displayWeatherData={displayWeatherData}
                isLoading={weatherLoading}
                hasError={weatherError}
              />
            </div>
            <div>
              {/* Average annual sunshine */}
              {averageSunshine !== null && (
                <GreaterSection title="Average Annual Sunshine" icon={SunshineIcon}>
                  <Text size="md">{averageSunshine.toFixed(1)} hours</Text>
                </GreaterSection>
              )}
            </div>
          </div>
        </div>
        {/* Right section - Data Charts */}
        <div className="w-full p-3 h-full">
          <DataChartTabs
            displaySunshineData={displaySunshineData}
            sunshineLoading={sunshineLoading}
            sunshineError={sunshineError}
            selectedMonth={monthToUse}
          />
        </div>
      </div>
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: CityPopupProps, nextProps: CityPopupProps): boolean => {
  // Check if city objects are the same by comparing key properties
  const prevCity = prevProps.city;
  const nextCity = nextProps.city;

  if (prevCity === nextCity) return true;
  if (!prevCity || !nextCity) return false;

  // Compare city identity by key properties
  const cityEqual =
    prevCity.city === nextCity.city &&
    prevCity.country === nextCity.country &&
    prevCity.lat === nextCity.lat &&
    prevCity.long === nextCity.long;

  // Compare other props
  const propsEqual =
    prevProps.selectedMonth === nextProps.selectedMonth &&
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.onClose === nextProps.onClose;

  return cityEqual && propsEqual;
};

export default memo(CityPopup, arePropsEqual);
