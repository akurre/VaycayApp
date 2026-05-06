import { useMemo } from 'react';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonStat } from '@/types/cityPopupTypes';
import type { TemperatureUnit } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { useSunshineAndRainfallData } from './useSunshineAndRainfallData';

interface UseRibbonStatsProps {
  basePopulation: number | null;
  comparisonPopulation: number | null;
  displayWeatherData: WeatherData | null;
  comparisonWeatherData: WeatherData | null;
  displaySunshineData: SunshineData | null;
  comparisonSunshineData: SunshineData | null;
  weeklyWeatherData: CityWeeklyWeather | null;
  comparisonWeeklyWeatherData: CityWeeklyWeather | null;
}

const PLACEHOLDER = '—';

const formatPopulation = (pop: number | null): string => {
  if (pop === null) return PLACEHOLDER;
  return pop.toLocaleString();
};

const formatTempRange = (
  min: number | null,
  max: number | null,
  unit: TemperatureUnit
): string => {
  if (min === null || max === null) return PLACEHOLDER;
  const minLabel = formatTemperature(min, unit);
  const maxLabel = formatTemperature(max, unit);
  if (minLabel === null || maxLabel === null) return PLACEHOLDER;
  return `${minLabel}–${maxLabel}`;
};

const formatHours = (n: number | null): string =>
  n === null ? PLACEHOLDER : `${n.toFixed(0)}h`;

const formatMm = (n: number | null): string =>
  n === null ? PLACEHOLDER : `${n.toFixed(0)}mm`;

export const useRibbonStats = ({
  basePopulation,
  comparisonPopulation,
  displayWeatherData,
  comparisonWeatherData,
  displaySunshineData,
  comparisonSunshineData,
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
}: UseRibbonStatsProps): ReadonlyArray<RibbonStat> => {
  const temperatureUnit = useAppStore((s) => s.temperatureUnit);

  const {
    averageSunshine,
    comparisonAverageSunshine,
    averageRainfall,
    comparisonAverageRainfall,
  } = useSunshineAndRainfallData({
    displaySunshineData,
    weeklyWeatherData: weeklyWeatherData?.weeklyData ?? null,
    comparisonSunshineData,
    comparisonWeeklyWeatherData: comparisonWeeklyWeatherData?.weeklyData ?? null,
  });

  return useMemo<ReadonlyArray<RibbonStat>>(
    () => [
      {
        label: 'Sun / yr',
        v1: formatHours(averageSunshine),
        v2: formatHours(comparisonAverageSunshine),
      },
      {
        label: 'Rain / yr',
        v1: formatMm(averageRainfall),
        v2: formatMm(comparisonAverageRainfall),
      },
      {
        label: 'Today range',
        v1: formatTempRange(
          displayWeatherData?.minTemperature ?? null,
          displayWeatherData?.maxTemperature ?? null,
          temperatureUnit
        ),
        v2: formatTempRange(
          comparisonWeatherData?.minTemperature ?? null,
          comparisonWeatherData?.maxTemperature ?? null,
          temperatureUnit
        ),
      },
      {
        label: 'Avg today',
        v1:
          formatTemperature(
            displayWeatherData?.avgTemperature ?? null,
            temperatureUnit
          ) ?? PLACEHOLDER,
        v2:
          formatTemperature(
            comparisonWeatherData?.avgTemperature ?? null,
            temperatureUnit
          ) ?? PLACEHOLDER,
      },
      {
        label: 'Population',
        v1: formatPopulation(basePopulation),
        v2: formatPopulation(comparisonPopulation),
      },
    ],
    [
      averageSunshine,
      comparisonAverageSunshine,
      averageRainfall,
      comparisonAverageRainfall,
      displayWeatherData,
      comparisonWeatherData,
      basePopulation,
      comparisonPopulation,
      temperatureUnit,
    ]
  );
};
