import { memo, useMemo } from 'react';
import { Alert, Badge, Loader, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';
import { calculateAverageRainfall } from '@/utils/dataFormatting/calculateAverageRainfall';
import GreaterSection from './GreaterSection';
import CustomPaper from '../Shared/CustomPaper';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';

import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface SunshineValuesProps {
  displaySunshineData: SunshineData | null;
  weeklyWeatherData: WeekDataPoint[] | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonSunshineData?: SunshineData | null;
  comparisonWeeklyWeatherData?: WeekDataPoint[] | null;
  comparisonCity?: string;
  baseCity: string;
}

const SunshineValues = ({
  displaySunshineData,
  weeklyWeatherData,
  isLoading,
  hasError,
  comparisonSunshineData,
  comparisonWeeklyWeatherData,
  comparisonCity,
  baseCity,
}: SunshineValuesProps) => {
  // Calculate average sunshine if we have sunshine data
  const averageSunshine = useMemo(() => {
    if (!displaySunshineData) return null;
    const chartData = transformSunshineDataForChart(displaySunshineData);
    return calculateAverageSunshine(chartData);
  }, [displaySunshineData]);

  // Calculate average sunshine for comparison city
  const comparisonAverageSunshine = useMemo(() => {
    if (!comparisonSunshineData) return null;
    const chartData = transformSunshineDataForChart(comparisonSunshineData);
    return calculateAverageSunshine(chartData);
  }, [comparisonSunshineData]);

  // Calculate average annual rainfall from weekly weather data
  const averageRainfall = useMemo(() => {
    if (!weeklyWeatherData) return null;
    return calculateAverageRainfall(weeklyWeatherData);
  }, [weeklyWeatherData]);

  // Calculate average annual rainfall for comparison city
  const comparisonAverageRainfall = useMemo(() => {
    if (!comparisonWeeklyWeatherData) return null;
    return calculateAverageRainfall(comparisonWeeklyWeatherData);
  }, [comparisonWeeklyWeatherData]);

  const hasComparison = comparisonSunshineData || comparisonWeeklyWeatherData;

  // determine if we have any data to show
  const hasSunshineData = displaySunshineData && averageSunshine !== null;
  const hasRainfallData = averageRainfall !== null;
  const hasAnyData = hasSunshineData || hasRainfallData;

  return (
    <CustomPaper className="h-full">
      {isLoading && !displaySunshineData && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !displaySunshineData && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          Failed to load sunshine data for this city.
        </Alert>
      )}

      {hasAnyData ? (
        <>
          {hasSunshineData && (
            <GreaterSection title="Average Annual Sunshine">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 justify-between">
                  {comparisonCity && (
                    <Badge variant='light'>{baseCity}</Badge>
                  )}
                  <Text
                    size="md"
                    style={{ color: hasComparison ? CITY1_PRIMARY_COLOR : undefined }}
                  >
                    {averageSunshine.toFixed(1)} hours
                  </Text>
                </div>
                {hasComparison && comparisonAverageSunshine !== null && (
                  <div className="flex gap-2 justify-between">
                    <Badge variant='light' style={{ color: CITY2_PRIMARY_COLOR }}>{comparisonCity}</Badge>
                    <Text size="md" style={{ color: CITY2_PRIMARY_COLOR }}>
                      {comparisonAverageSunshine.toFixed(1)} hours
                    </Text>
                  </div>
                )}
              </div>
            </GreaterSection>
          )}
          {hasRainfallData && (
            <GreaterSection title="Average Annual Rainfall">
              <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center justify-between">
                  {comparisonCity && (
                    <Badge variant='light'>{baseCity}</Badge>
                  )}
                  <Text
                    size="md"
                    style={{ color: hasComparison ? CITY1_PRIMARY_COLOR : undefined }}
                  >
                    {averageRainfall.toFixed(1)} mm
                  </Text>
                </div>
                {hasComparison && comparisonAverageRainfall !== null && (
                  <div className="flex gap-2 items-center justify-between">
                    <Badge variant='light' style={{ color: CITY2_PRIMARY_COLOR }}>{comparisonCity}</Badge>
                    <Text size="md" style={{ color: CITY2_PRIMARY_COLOR }}>
                      {comparisonAverageRainfall.toFixed(1)} mm
                    </Text>
                  </div>
                )}
              </div>
            </GreaterSection>
          )}
        </>
      ) : (
        !isLoading && !hasError && <>No data to show.</>
      )}
    </CustomPaper>
  );
};

export default memo(SunshineValues);
