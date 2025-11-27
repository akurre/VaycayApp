import { memo } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import RainfallGraph from './graphs/RainfallGraph';
import WeatherDataSection from './WeatherDataSection';

interface RainfallDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  comparisonIsLoading?: boolean;
  comparisonHasError?: boolean;
}

const RainfallDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
  comparisonWeeklyWeatherData,
  comparisonIsLoading,
  comparisonHasError,
}: RainfallDataSectionProps) => {
  return (
    <WeatherDataSection
      data={weeklyWeatherData}
      isLoading={isLoading}
      hasError={hasError}
      errorMessage="Failed to load precipitation data for this city."
      showNoDataBadge={false}
    >
      {(data) => (
        <RainfallGraph
          weeklyWeatherData={data}
          comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
        />
      )}
    </WeatherDataSection>
  );
};

export default memo(RainfallDataSection);
