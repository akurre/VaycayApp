import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import TemperatureGraph from './TemperatureGraph';

interface TemperatureDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
}

const TemperatureDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
}: TemperatureDataSectionProps) => {
  return (
    <>
      {isLoading && !weeklyWeatherData && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !weeklyWeatherData && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          Failed to load temperature data for this city.
        </Alert>
      )}

      {weeklyWeatherData && (
        <div className="h-full p-3">
          <TemperatureGraph weeklyWeatherData={weeklyWeatherData} />
        </div>
      )}
    </>
  );
};

export default memo(TemperatureDataSection);
