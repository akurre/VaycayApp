import { useMemo } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';
import { calculateAverageRainfall } from '@/utils/dataFormatting/calculateAverageRainfall';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';

interface UseSunshineAndRainfallDataProps {
  displaySunshineData: SunshineData | null;
  weeklyWeatherData: WeekDataPoint[] | null;
  comparisonSunshineData?: SunshineData | null;
  comparisonWeeklyWeatherData?: WeekDataPoint[] | null;
}

export const useSunshineAndRainfallData = ({
  displaySunshineData,
  weeklyWeatherData,
  comparisonSunshineData,
  comparisonWeeklyWeatherData,
}: UseSunshineAndRainfallDataProps) => {
  // calculate average sunshine if we have sunshine data
  const averageSunshine = useMemo(() => {
    if (!displaySunshineData) return null;
    const chartData = transformSunshineDataForChart(displaySunshineData);
    return calculateAverageSunshine(chartData);
  }, [displaySunshineData]);

  // calculate average sunshine for comparison city
  const comparisonAverageSunshine = useMemo(() => {
    if (!comparisonSunshineData) return null;
    const chartData = transformSunshineDataForChart(comparisonSunshineData);
    return calculateAverageSunshine(chartData);
  }, [comparisonSunshineData]);

  // calculate average annual rainfall from weekly weather data
  const averageRainfall = useMemo(() => {
    if (!weeklyWeatherData) return null;
    return calculateAverageRainfall(weeklyWeatherData);
  }, [weeklyWeatherData]);

  // calculate average annual rainfall for comparison city
  const comparisonAverageRainfall = useMemo(() => {
    if (!comparisonWeeklyWeatherData) return null;
    return calculateAverageRainfall(comparisonWeeklyWeatherData);
  }, [comparisonWeeklyWeatherData]);

  // determine if we have any data to show
  const hasSunshineData = displaySunshineData && averageSunshine !== null;
  const hasComparisonSunshineData =
    comparisonSunshineData && comparisonAverageSunshine !== null;
  const hasAnySunshineData = hasSunshineData || hasComparisonSunshineData;

  const hasRainfallData = averageRainfall !== null;
  const hasComparisonRainfallData = comparisonAverageRainfall !== null;
  const hasAnyRainfallData = hasRainfallData || hasComparisonRainfallData;

  const hasAnyData = hasAnySunshineData || hasAnyRainfallData;
  const hasComparison = comparisonSunshineData || comparisonWeeklyWeatherData;

  return {
    averageSunshine,
    comparisonAverageSunshine,
    averageRainfall,
    comparisonAverageRainfall,
    hasSunshineData,
    hasComparisonSunshineData,
    hasAnySunshineData,
    hasRainfallData,
    hasComparisonRainfallData,
    hasAnyRainfallData,
    hasAnyData,
    hasComparison,
  };
};
