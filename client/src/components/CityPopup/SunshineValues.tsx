import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';
import GreaterSection from './GreaterSection';
import CustomPaper from '../Shared/CustomPaper';
import ComparisonRow from './ComparisonRow';
import { useSunshineAndRainfallData } from './hooks/useSunshineAndRainfallData';

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
  const {
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
  } = useSunshineAndRainfallData({
    displaySunshineData,
    weeklyWeatherData,
    comparisonSunshineData,
    comparisonWeeklyWeatherData,
  });

  // format values with units or "N/A"
  const sunshineValue = hasSunshineData
    ? `${averageSunshine!.toFixed(1)} hours`
    : 'N/A';
  const comparisonSunshineValue = hasComparisonSunshineData
    ? `${comparisonAverageSunshine!.toFixed(1)} hours`
    : 'N/A';
  const rainfallValue = hasRainfallData
    ? `${averageRainfall!.toFixed(1)} mm`
    : 'N/A';
  const comparisonRainfallValue = hasComparisonRainfallData
    ? `${comparisonAverageRainfall!.toFixed(1)} mm`
    : 'N/A';

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
          {hasAnySunshineData && (
            <GreaterSection title="Average Annual Sunshine">
              <div className="flex flex-col gap-1">
                <ComparisonRow
                  cityName={baseCity}
                  value={sunshineValue}
                  showCityBadge={!!comparisonCity}
                />
                {hasComparison && (
                  <ComparisonRow
                    cityName={comparisonCity!}
                    value={comparisonSunshineValue}
                    isComparison
                    showCityBadge
                  />
                )}
              </div>
            </GreaterSection>
          )}
          {hasAnyRainfallData && (
            <GreaterSection title="Average Annual Rainfall">
              <div className="flex flex-col gap-1">
                <ComparisonRow
                  cityName={baseCity}
                  value={rainfallValue}
                  showCityBadge={!!comparisonCity}
                />
                {hasComparison && (
                  <ComparisonRow
                    cityName={comparisonCity!}
                    value={comparisonRainfallValue}
                    isComparison
                    showCityBadge
                  />
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
