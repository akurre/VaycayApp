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

interface UseSunshineAndRainfallDataResult {
  averageSunshine: number | null;
  comparisonAverageSunshine: number | null;
  averageRainfall: number | null;
  comparisonAverageRainfall: number | null;
}

export const useSunshineAndRainfallData = ({
  displaySunshineData,
  weeklyWeatherData,
  comparisonSunshineData,
  comparisonWeeklyWeatherData,
}: UseSunshineAndRainfallDataProps): UseSunshineAndRainfallDataResult => {
  const averageSunshine = useMemo(() => {
    if (!displaySunshineData) return null;
    const chartData = transformSunshineDataForChart(displaySunshineData);
    return calculateAverageSunshine(chartData);
  }, [displaySunshineData]);

  const comparisonAverageSunshine = useMemo(() => {
    if (!comparisonSunshineData) return null;
    const chartData = transformSunshineDataForChart(comparisonSunshineData);
    return calculateAverageSunshine(chartData);
  }, [comparisonSunshineData]);

  const averageRainfall = useMemo(() => {
    if (!weeklyWeatherData) return null;
    return calculateAverageRainfall(weeklyWeatherData);
  }, [weeklyWeatherData]);

  const comparisonAverageRainfall = useMemo(() => {
    if (!comparisonWeeklyWeatherData) return null;
    return calculateAverageRainfall(comparisonWeeklyWeatherData);
  }, [comparisonWeeklyWeatherData]);

  return {
    averageSunshine,
    comparisonAverageSunshine,
    averageRainfall,
    comparisonAverageRainfall,
  };
};
