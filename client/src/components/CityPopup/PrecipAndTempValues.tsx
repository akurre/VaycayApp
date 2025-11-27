import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { WeatherData } from '@/types/cityWeatherDataType';
import TemperatureSection from './TemperatureSection';
import CustomPaper from '../Shared/CustomPaper';

interface PrecipAndTempValuesProps {
  displayWeatherData: WeatherData | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeatherData?: WeatherData | null;
}

const PrecipAndTempValues = ({
  displayWeatherData,
  isLoading,
  hasError,
  comparisonWeatherData,
}: PrecipAndTempValuesProps) => {
  return (
    <CustomPaper>
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
        />
      ) : (
        <>No weather data to show.</>
      )}
    </CustomPaper>
  );
};

export default memo(PrecipAndTempValues);
