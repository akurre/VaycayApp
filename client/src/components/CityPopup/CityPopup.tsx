import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import type { CityPopupProps } from '@/types/mapTypes';
import { DataType } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';
import DataChartTabs from './DataChartTabs';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';
import { extractMonthDay } from '@/utils/dateFormatting/extractMonthDay';
import { isWeatherData } from '@/utils/typeGuards';
import ComparisonCitySelector from './ComparisonCitySelector';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { appColors } from '@/theme';
import RibbonShell from './Ribbon/RibbonShell';
import { useRibbonStats } from './hooks/useRibbonStats';

const CityPopup = ({
  city,
  onClose,
  selectedMonth,
  selectedDate,
  dataType,
}: CityPopupProps) => {
  const { colorScheme } = useMantineColorScheme();

  const [comparisonCity, setComparisonCity] =
    useState<SearchCitiesResult | null>(null);

  const hasWeatherData = city && isWeatherData(city);
  const hasSunshineData = city && !isWeatherData(city);

  const cityAsWeather = hasWeatherData ? city : null;
  const cityAsSunshine = hasSunshineData ? city : null;

  const monthToUse =
    selectedMonth ??
    extractMonthFromDate(cityAsWeather?.date) ??
    new Date().getMonth() + 1;

  const dateToUse = useMemo(() => {
    if (selectedDate && dataType === DataType.Temperature) {
      return selectedDate;
    }
    if (cityAsWeather?.date && !selectedDate) {
      return cityAsWeather.date;
    }
    return `${monthToUse.toString().padStart(2, '0')}-15`;
  }, [selectedDate, dataType, cityAsWeather, monthToUse]);

  const shouldFetchWeather = !!city && dataType === DataType.Temperature;

  const { weatherData } = useWeatherDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    selectedDate: dateToUse,
    skipFetch: !shouldFetchWeather,
  });

  const shouldFetchSunshine =
    !hasSunshineData && monthToUse >= 1 && monthToUse <= 12;

  const { sunshineData, sunshineLoading, sunshineError } =
    useSunshineDataForCity({
      cityName: city?.city ?? null,
      lat: city?.lat ?? null,
      long: city?.long ?? null,
      skipFetch: !shouldFetchSunshine,
    });

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

  const monthDayOnly = useMemo(() => extractMonthDay(dateToUse), [dateToUse]);

  const { weatherData: comparisonWeatherData } = useWeatherDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    selectedDate: monthDayOnly,
    skipFetch: !comparisonCity,
  });

  const { weeklyWeatherData: comparisonWeeklyWeatherData } =
    useWeeklyWeatherForCity({
      cityName: comparisonCity?.name ?? null,
      lat: comparisonCity?.lat ?? null,
      long: comparisonCity?.long ?? null,
      skipFetch: !comparisonCity,
    });

  const { sunshineData: comparisonSunshineData } = useSunshineDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    skipFetch: !comparisonCity,
  });

  const displayWeatherData = useMemo(() => {
    if (weatherData && dataType === DataType.Temperature) {
      return weatherData;
    }
    return cityAsWeather;
  }, [weatherData, cityAsWeather, dataType]);

  const displaySunshineData = cityAsSunshine ?? sunshineData;

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

  const stats = useRibbonStats({
    basePopulation: city?.population ?? null,
    comparisonPopulation: comparisonCity?.population ?? null,
    displayWeatherData,
    comparisonWeatherData,
    displaySunshineData,
    comparisonSunshineData,
    weeklyWeatherData,
    comparisonWeeklyWeatherData,
  });

  if (!city) return null;

  let cityAndCountry = city.city ? toTitleCase(city.city) : 'Unknown City';
  if (city.state) {
    const state =
      city.state.length > 8 ? city.state.substring(0, 8) + '.' : city.state;
    cityAndCountry += `, ${toTitleCase(state)}`;
  }
  if (city.country) {
    cityAndCountry += `, ${city.country}`;
  }

  const todayC1 = displayWeatherData?.avgTemperature ?? null;
  const todayC2 = comparisonWeatherData?.avgTemperature ?? null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 shadow-lg rounded-xl z-50 flex flex-col"
      style={{
        height: '40vh',
        pointerEvents: 'auto',
        backgroundColor:
          colorScheme === 'dark'
            ? appColors.dark.surface
            : appColors.light.surface,
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <div className="absolute top-2 right-2 z-10">
        <ActionIcon onClick={onClose} aria-label="Close">
          <IconX size={24} />
        </ActionIcon>
      </div>
      <RibbonShell
        baseCityName={cityAndCountry}
        baseCityLat={city.lat ?? null}
        comparisonCity={comparisonCity}
        initialTab={dataType}
        todayC1={todayC1}
        todayC2={todayC2}
        selectedDate={dateToUse}
        stats={stats}
        comparisonSlot={
          <ComparisonCitySelector
            onCitySelect={setComparisonCity}
            onCityRemove={() => setComparisonCity(null)}
            selectedCity={comparisonCity}
            excludeCity={excludeCity}
          />
        }
        renderChart={(tab, onHover) => (
          <DataChartTabs
            tab={tab}
            displaySunshineData={displaySunshineData}
            sunshineLoading={sunshineLoading}
            sunshineError={!!sunshineError}
            selectedMonth={monthToUse}
            weeklyWeatherData={weeklyWeatherData}
            weeklyWeatherLoading={weeklyWeatherLoading}
            weeklyWeatherError={!!weeklyWeatherError}
            comparisonSunshineData={comparisonSunshineData}
            comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
            onHover={onHover}
          />
        )}
      />
    </div>
  );
};

export default CityPopup;
