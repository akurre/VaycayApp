import { memo, useMemo } from 'react';
import { Alert, Loader, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';
import { calculateAverageRainfall } from '@/utils/dataFormatting/calculateAverageRainfall';
import GreaterSection from './GreaterSection';
import CustomPaper from '../Shared/CustomPaper';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { calculateAverageSunshine } from '@/utils/dataFormatting/calculateAverageSunshine';
import getSunshineHoursIcon from '@/utils/iconMapping/getSunshineIcon';

interface SunshineValuesProps {
  displaySunshineData: SunshineData | null;
  weeklyWeatherData: WeekDataPoint[] | null;
  isLoading: boolean;
  hasError: boolean;
}

const SunshineValues = ({ displaySunshineData, weeklyWeatherData, isLoading, hasError }: SunshineValuesProps) => {
  // Calculate average sunshine if we have sunshine data
  const averageSunshine = useMemo(() => {
    if (!displaySunshineData) return null;
    const chartData = transformSunshineDataForChart(displaySunshineData);
    return calculateAverageSunshine(chartData);
  }, [displaySunshineData]);

  // Calculate average annual rainfall from weekly weather data
  const averageRainfall = useMemo(() => {
    if (!weeklyWeatherData) return null;
    return calculateAverageRainfall(weeklyWeatherData);
  }, [weeklyWeatherData]);

  // Get the sunshine icon
  const SunshineIcon = getSunshineHoursIcon(averageSunshine);

  return (
    <CustomPaper>
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

      {displaySunshineData && averageSunshine !== null ? (
        <>
        <GreaterSection title="Average Annual Sunshine" icon={SunshineIcon}>
          <Text size="md">{averageSunshine.toFixed(1)} hours</Text>
        </GreaterSection>
        <GreaterSection title="Average Annual Rainfall" icon={SunshineIcon}>
          <Text size="md">{averageRainfall !== null ? `${averageRainfall.toFixed(1)} mm` : 'No data'}</Text>
        </GreaterSection>
        </>
      ) : (
        !isLoading && !hasError && <>No sunshine data to show.</>
      )}
    </CustomPaper>
  );
};

export default memo(SunshineValues);
