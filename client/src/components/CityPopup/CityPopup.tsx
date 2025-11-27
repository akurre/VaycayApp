import { ActionIcon, Title, Badge } from '@mantine/core';
import { useMemo, memo, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import type { CityPopupProps } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';
import PrecipAndTempValues from './PrecipAndTempValues';
import SunshineValues from './SunshineValues';
import AdditionalInfo from './AdditionalInfo';
import DataChartTabs from './DataChartTabs';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';
import { extractMonthDay } from '@/utils/dateFormatting/extractMonthDay';
import { isWeatherData } from '@/utils/typeGuards';
import arePropsEqual from './utils/arePropsEqual';
import ComparisonCitySelector from './ComparisonCitySelector';
import type { SearchCitiesResult } from '@/types/userLocationType';

const CityPopup = ({ city, onClose, selectedMonth, selectedDate, dataType }: CityPopupProps) => {
  // State for comparison city
  const [comparisonCity, setComparisonCity] = useState<SearchCitiesResult | null>(null);

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

  // Fetch weekly weather data for the city (always fetch when we have a city)
  const {
    weeklyWeatherData,
    loading: weeklyWeatherLoading,
    error: weeklyWeatherError,
  } = useWeeklyWeatherForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    skipFetch: !city,
  });

  // Extract month-day only from dateToUse for comparison city
  // (removes year if present, e.g., "2020-11-26" -> "11-26")
  const monthDayOnly = useMemo(() => extractMonthDay(dateToUse), [dateToUse]);

  // Fetch weather data for the comparison city
  const {
    weatherData: comparisonWeatherData,
    weatherLoading: comparisonWeatherLoading,
    weatherError: comparisonWeatherError,
  } = useWeatherDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    selectedDate: monthDayOnly,
    skipFetch: !comparisonCity,
  });

  // Fetch weekly weather data for the comparison city
  const {
    weeklyWeatherData: comparisonWeeklyWeatherData,
    loading: comparisonWeeklyWeatherLoading,
    error: comparisonWeeklyWeatherError,
  } = useWeeklyWeatherForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    skipFetch: !comparisonCity,
  });

  // Fetch sunshine data for the comparison city
  const {
    sunshineData: comparisonSunshineData,
    sunshineLoading: comparisonSunshineLoading,
    sunshineError: comparisonSunshineError,
  } = useSunshineDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    skipFetch: !comparisonCity,
  });

  // use what we already have, or fall back to fetched data
  const displayWeatherData = cityAsWeather ?? weatherData;
  const displaySunshineData = cityAsSunshine ?? sunshineData;

  // Memoize excludeCity to prevent unnecessary re-renders and search queries
  const excludeCity = useMemo(
    () =>
      city
        ? {
            name: city.city,
            state: city.state ?? null,
            country: city.country ?? null,
          }
        : undefined,
    [city?.city, city?.state, city?.country]
  );

  // early return AFTER all hooks have been called
  if (!city) return null;

  // Create the modal title
  let cityAndCountry = city.city ? toTitleCase(city.city) : 'Unknown City';
  if (city.state) {
    cityAndCountry += `, ${toTitleCase(city.state)}`;
  }
  if (city.country) {
    cityAndCountry += `, ${city.country}`;
  }

  return (
    <div
      className="z-50 fixed bottom-4 left-4 right-4 shadow-lg rounded-xl z-50 flex flex-col"
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
      <div className="flex h-full overflow-hidden py-3 px-6 gap-6">
        {/* Left section - City info and metadata */}
        <div className="flex flex-col gap-3 h-full min-w-1/2 overflow-y-auto grow">
          <div className="flex gap-6">
            <div className="flex items-center">
              <Badge size="xl">
                <Title order={4}>{cityAndCountry}</Title>
              </Badge>
            </div>
            <div className="flex-1" />
            <div className="flex justify-end">
              <ComparisonCitySelector
                onCitySelect={setComparisonCity}
                onCityRemove={() => setComparisonCity(null)}
                selectedCity={comparisonCity}
                excludeCity={excludeCity}
              />
            </div>
          </div>
          <div className="flex gap-6 w-full justify-end">
            <AdditionalInfo city={city} />

            {/* Middle section - Weather data */}
            <div className="flex flex-col w-5/12">
              <PrecipAndTempValues
                displayWeatherData={displayWeatherData}
                isLoading={weatherLoading}
                hasError={weatherError}
                comparisonWeatherData={comparisonWeatherData}
              />
            </div>
            {/* Average annual sunshine */}
            <SunshineValues
              displaySunshineData={displaySunshineData}
              weeklyWeatherData={weeklyWeatherData?.weeklyData ?? null}
              isLoading={sunshineLoading}
              hasError={sunshineError}
              comparisonSunshineData={comparisonSunshineData}
              comparisonWeeklyWeatherData={comparisonWeeklyWeatherData?.weeklyData ?? null}
            />
          </div>
        </div>
        {/* Right section - Data Charts */}
        <div className="w-full h-full">
          <DataChartTabs
            dataType={dataType}
            displaySunshineData={displaySunshineData}
            sunshineLoading={sunshineLoading}
            sunshineError={sunshineError}
            selectedMonth={monthToUse}
            weeklyWeatherData={weeklyWeatherData}
            weeklyWeatherLoading={weeklyWeatherLoading}
            weeklyWeatherError={weeklyWeatherError}
            comparisonSunshineData={comparisonSunshineData}
            comparisonSunshineLoading={comparisonSunshineLoading}
            comparisonSunshineError={comparisonSunshineError}
            comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
            comparisonWeeklyWeatherLoading={comparisonWeeklyWeatherLoading}
            comparisonWeeklyWeatherError={comparisonWeeklyWeatherError}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(CityPopup, arePropsEqual);
