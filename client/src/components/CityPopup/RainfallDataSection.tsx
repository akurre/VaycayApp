import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import RainfallGraph from './RainfallGraph';

interface RainfallDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
}

const RainfallDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
}: RainfallDataSectionProps) => {
  return (
    <div className="h-full flex flex-col">
      {isLoading && !weeklyWeatherData && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !weeklyWeatherData && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          Failed to load precipitation data for this city.
        </Alert>
      )}

      {weeklyWeatherData && (
        <div className="flex-1 min-h-0 p-3">
          <RainfallGraph weeklyWeatherData={weeklyWeatherData} />
        </div>
      )}
    </div>
  );
};

export default memo(RainfallDataSection);
