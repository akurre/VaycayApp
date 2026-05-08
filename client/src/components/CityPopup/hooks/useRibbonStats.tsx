import { useMemo } from 'react';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonStat } from '@/types/cityPopupTypes';
import { useAppStore } from '@/stores/useAppStore';
import { formatMm } from '@/utils/dataFormatting/formatMm';
import { formatPopulation } from '@/utils/dataFormatting/formatPopulation';
import { formatTempRange } from '@/utils/dataFormatting/formatTempRange';
import { formatDistanceFromHome } from '@/utils/location/formatDistanceFromHome';
import SunStatValue from '@/components/CityPopup/Ribbon/SunStatValue';
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
  const homeLat = useAppStore((s) => s.homeLocation?.coordinates.lat ?? null);
  const homeLong = useAppStore((s) => s.homeLocation?.coordinates.long ?? null);

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
        label: "This day's range",
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
