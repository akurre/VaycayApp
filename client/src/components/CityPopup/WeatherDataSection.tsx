import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { WeatherData } from '@/types/cityWeatherDataType';
import Field from './Field';
import TemperatureSection from './TemperatureSection';
import PrecipitationSection from './PrecipitationSection';

interface WeatherDataSectionProps {
  displayWeatherData: WeatherData | null;
  isLoading: boolean;
  hasError: boolean;
}

const WeatherDataSection = ({ 
  displayWeatherData, 
  isLoading, 
  hasError 
}: WeatherDataSectionProps) => {
  return (
    <>
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
      
      {displayWeatherData && (
        <>
          <Field label="Date" value={displayWeatherData.date} />
          <TemperatureSection
            avgTemperature={displayWeatherData.avgTemperature}
            maxTemperature={displayWeatherData.maxTemperature}
            minTemperature={displayWeatherData.minTemperature}
          />
          {displayWeatherData.precipitation && (
            <PrecipitationSection
              precipitation={displayWeatherData.precipitation}
              snowDepth={displayWeatherData.snowDepth}
            />
          )}
        </>
      )}
    </>
  );
};

export default WeatherDataSection;
