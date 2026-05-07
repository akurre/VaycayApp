import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useMemo, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import type { CityPopupProps } from '@/types/mapTypes';
import { DataType } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';
import DataChartTabs from '@/components/CityPopup/DataChartTabs';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';
import { extractMonthDay } from '@/utils/dateFormatting/extractMonthDay';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';
import { isWeatherData } from '@/utils/typeGuards';
import ComparisonCitySelector from '@/components/CityPopup/ComparisonCitySelector';
import type { SearchCitiesResult } from '@/types/userLocationType';
import type { TodayValuesByTab } from '@/types/cityPopupTypes';
import { appColors } from '@/theme';
import RibbonShell from '@/components/CityPopup/Ribbon/RibbonShell';
import { useRibbonStats } from '@/components/CityPopup/hooks/useRibbonStats';
import { getSunshinePercent } from '@/utils/dataFormatting/getSunshinePercent';
import { normalizeWeekPrecip } from '@/utils/dataFormatting/normalizeWeekPrecip';
import { normalizeRainyDays } from '@/utils/dataFormatting/normalizeRainyDays';
import {
  MONTH_MIDPOINT_DAY,
  STATE_ABBREVIATION_MAX_LENGTH,
} from '@/const';

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

  const cityAsWeather = city && isWeatherData(city) ? city : null;
  const cityAsSunshine = city && !isWeatherData(city) ? city : null;

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
    return `${monthToUse.toString().padStart(2, '0')}-${MONTH_MIDPOINT_DAY
      .toString()
      .padStart(2, '0')}`;
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
    !cityAsSunshine && monthToUse >= 1 && monthToUse <= 12;

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
    baseLat: city?.lat ?? null,
    baseLong: city?.long ?? null,
    comparisonLat: comparisonCity?.lat ?? null,
    comparisonLong: comparisonCity?.long ?? null,
    displayWeatherData,
    comparisonWeatherData,
    displaySunshineData,
    comparisonSunshineData,
    weeklyWeatherData,
    comparisonWeeklyWeatherData,
  });

  // Per-tab "today" values for the readout. Each tab needs a value at the
  // grain it can actually display: temperature is daily, sunshine is monthly,
  // precip is weekly (matching the chart's normalized 7-day mm).
  const todayValuesByTab = useMemo<TodayValuesByTab>(() => {
    const selectedWeek = dateToWeekOfYear(dateToUse);
    const findWeek = (data: typeof weeklyWeatherData) =>
      selectedWeek === null
        ? null
        : (data?.weeklyData.find((w) => w.week === selectedWeek) ?? null);

    const w1 = findWeek(weeklyWeatherData);
    const w2 = findWeek(comparisonWeeklyWeatherData);

    return {
      [DataType.Temperature]: {
        c1: displayWeatherData?.avgTemperature ?? null,
        c2: comparisonWeatherData?.avgTemperature ?? null,
      },
      [DataType.Sunshine]: {
        c1: getSunshinePercent(displaySunshineData, monthToUse, city?.lat),
        c2: getSunshinePercent(
          comparisonSunshineData,
          monthToUse,
          comparisonCity?.lat
        ),
      },
      [DataType.Precip]: {
        c1: normalizeWeekPrecip(w1),
        c2: normalizeWeekPrecip(w2),
        subC1: normalizeRainyDays(w1),
        subC2: normalizeRainyDays(w2),
      },
    };
  }, [
    dateToUse,
    monthToUse,
    city?.lat,
    comparisonCity?.lat,
    displayWeatherData,
    comparisonWeatherData,
    displaySunshineData,
    comparisonSunshineData,
    weeklyWeatherData,
    comparisonWeeklyWeatherData,
  ]);

  if (!city) return null;

  let cityAndCountry = city.city ? toTitleCase(city.city) : 'Unknown City';
  if (city.state) {
    const state =
      city.state.length > STATE_ABBREVIATION_MAX_LENGTH
        ? city.state.substring(0, STATE_ABBREVIATION_MAX_LENGTH) + '.'
        : city.state;
    cityAndCountry += `, ${toTitleCase(state)}`;
  }
  if (city.country) {
    cityAndCountry += `, ${city.country}`;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 shadow-lg rounded-xl z-50 flex flex-col"
      style={{
        height: '50vh',
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
        todayValuesByTab={todayValuesByTab}
        selectedDate={dateToUse}
        stats={stats}
        comparisonNode={
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
            selectedDate={dateToUse}
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
