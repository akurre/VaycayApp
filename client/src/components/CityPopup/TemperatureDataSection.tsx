import { memo } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import TemperatureGraph from './graphs/TemperatureGraph';
import WeatherDataSection from './WeatherDataSection';
import ComponentErrorBoundary from '../ErrorBoundary/ComponentErrorBoundary';

interface TemperatureDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  comparisonIsLoading?: boolean;
  comparisonHasError?: boolean;
}

const TemperatureDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
  comparisonWeeklyWeatherData,
  comparisonIsLoading,
  comparisonHasError,
}: TemperatureDataSectionProps) => {
  return (
    <WeatherDataSection
      data={weeklyWeatherData}
      isLoading={isLoading}
      hasError={hasError}
      errorMessage="Failed to load temperature data for this city."
      showNoDataBadge={false}
    >
      {(data) => (
        <ComponentErrorBoundary componentName="TemperatureGraph">
          <TemperatureGraph
            weeklyWeatherData={data}
            comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
          />
        </ComponentErrorBoundary>
      )}
    </WeatherDataSection>
  );
};

export default memo(TemperatureDataSection);
