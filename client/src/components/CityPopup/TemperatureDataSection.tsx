import { memo } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import TemperatureGraph from './graphs/TemperatureGraph';
import WeatherDataSection from './WeatherDataSection';
import ComponentErrorBoundary from '../ErrorBoundary/ComponentErrorBoundary';

interface TemperatureDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  selectedDate?: string;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const TemperatureDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
  comparisonWeeklyWeatherData,
  selectedDate,
  onHover,
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
            selectedDate={selectedDate}
            onHover={onHover}
          />
        </ComponentErrorBoundary>
      )}
    </WeatherDataSection>
  );
};

export default memo(TemperatureDataSection);
