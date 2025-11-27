import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { WeatherData } from '@/types/cityWeatherDataType';
import TemperatureSection from './TemperatureSection';
import CustomPaper from '../Shared/CustomPaper';

interface DailyTempValuesProps {
  displayWeatherData: WeatherData | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeatherData?: WeatherData | null;
}

const DailyTempValues = ({
  displayWeatherData,
  isLoading,
  hasError,
  comparisonWeatherData,
}: DailyTempValuesProps) => {
  return (
    <CustomPaper className='h-full'>
      {isLoading && !displayWeatherData && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !displayWeatherData && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          Failed to load temperature data for this city.
        </Alert>
      )}

      {displayWeatherData ? (
        <TemperatureSection
          avgTemperature={displayWeatherData.avgTemperature}
          maxTemperature={displayWeatherData.maxTemperature}
          minTemperature={displayWeatherData.minTemperature}
          comparisonAvgTemperature={comparisonWeatherData?.avgTemperature}
          comparisonMaxTemperature={comparisonWeatherData?.maxTemperature}
          comparisonMinTemperature={comparisonWeatherData?.minTemperature}
          comparisonCity={comparisonWeatherData?.city}
          baseCity={displayWeatherData.city}
        />
      ) : (
        <>No weather data to show.</>
      )}
    </CustomPaper>
  );
};

export default memo(DailyTempValues);
