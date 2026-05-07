import { useMemo } from 'react';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonStat } from '@/types/cityPopupTypes';
import type { TemperatureUnit } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { calculateDistance } from '@/utils/location/calculateDistance';
import { formatDistance } from '@/utils/location/formatDistance';
import { formatMm } from '@/utils/dataFormatting/formatMm';
import { EM_DASH_PLACEHOLDER } from '@/const';
import SunStatValue from '../Ribbon/SunStatValue';
import { useSunshineAndRainfallData } from './useSunshineAndRainfallData';

interface UseRibbonStatsProps {
  basePopulation: number | null;
  comparisonPopulation: number | null;
  baseLat: number | null;
  baseLong: number | null;
  comparisonLat: number | null;
  comparisonLong: number | null;
  displayWeatherData: WeatherData | null;
  comparisonWeatherData: WeatherData | null;
  displaySunshineData: SunshineData | null;
  comparisonSunshineData: SunshineData | null;
  weeklyWeatherData: CityWeeklyWeather | null;
  comparisonWeeklyWeatherData: CityWeeklyWeather | null;
}

const formatPopulation = (pop: number | null): string => {
  if (pop === null) return EM_DASH_PLACEHOLDER;
  return pop.toLocaleString();
};

const formatTempRange = (
  min: number | null,
  max: number | null,
  unit: TemperatureUnit
): string => {
  if (min === null || max === null) return EM_DASH_PLACEHOLDER;
  const minLabel = formatTemperature(min, unit);
  const maxLabel = formatTemperature(max, unit);
  if (minLabel === null || maxLabel === null) return EM_DASH_PLACEHOLDER;
  return `${minLabel}–${maxLabel}`;
};

const formatDistanceFromHome = (
  homeLat: number | null,
  homeLong: number | null,
  cityLat: number | null,
  cityLong: number | null,
  temperatureUnit: TemperatureUnit
): string => {
  if (
    homeLat === null ||
    homeLong === null ||
    cityLat === null ||
    cityLong === null
  ) {
    return EM_DASH_PLACEHOLDER;
  }
  return formatDistance(
    calculateDistance(homeLat, homeLong, cityLat, cityLong),
    temperatureUnit
  );
};

export const useRibbonStats = ({
  basePopulation,
  comparisonPopulation,
  baseLat,
  baseLong,
  comparisonLat,
  comparisonLong,
  displayWeatherData,
  comparisonWeatherData,
  displaySunshineData,
  comparisonSunshineData,
  weeklyWeatherData,
  comparisonWeeklyWeatherData,
}: UseRibbonStatsProps): ReadonlyArray<RibbonStat> => {
  const temperatureUnit = useAppStore((s) => s.temperatureUnit);
  const homeLocation = useAppStore((s) => s.homeLocation);
  const homeLat = homeLocation?.coordinates.lat ?? null;
  const homeLong = homeLocation?.coordinates.long ?? null;

  const {
    averageSunshine,
    comparisonAverageSunshine,
    averageRainfall,
    comparisonAverageRainfall,
  } = useSunshineAndRainfallData({
    displaySunshineData,
    weeklyWeatherData: weeklyWeatherData?.weeklyData ?? null,
    comparisonSunshineData,
    comparisonWeeklyWeatherData:
      comparisonWeeklyWeatherData?.weeklyData ?? null,
  });

  const baseMinTemp = displayWeatherData?.minTemperature ?? null;
  const baseMaxTemp = displayWeatherData?.maxTemperature ?? null;
  const compMinTemp = comparisonWeatherData?.minTemperature ?? null;
  const compMaxTemp = comparisonWeatherData?.maxTemperature ?? null;

  return useMemo<ReadonlyArray<RibbonStat>>(
    () => [
      {
        label: 'Sun / yr',
        v1: (
          <SunStatValue
            averageMonthlyHours={averageSunshine}
            latitude={baseLat}
          />
        ),
        v2: (
          <SunStatValue
            averageMonthlyHours={comparisonAverageSunshine}
            latitude={comparisonLat}
          />
        ),
      },
      {
        label: 'Rain / yr',
        v1: formatMm(averageRainfall),
        v2: formatMm(comparisonAverageRainfall),
      },
      {
        label: "Today's range",
        v1: formatTempRange(baseMinTemp, baseMaxTemp, temperatureUnit),
        v2: formatTempRange(compMinTemp, compMaxTemp, temperatureUnit),
      },
      {
        label: 'From home',
        v1: formatDistanceFromHome(
          homeLat,
          homeLong,
          baseLat,
          baseLong,
          temperatureUnit
        ),
        v2: formatDistanceFromHome(
          homeLat,
          homeLong,
          comparisonLat,
          comparisonLong,
          temperatureUnit
        ),
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
      baseMinTemp,
      baseMaxTemp,
      compMinTemp,
      compMaxTemp,
      basePopulation,
      comparisonPopulation,
      baseLat,
      baseLong,
      comparisonLat,
      comparisonLong,
      homeLat,
      homeLong,
      temperatureUnit,
    ]
  );
};
