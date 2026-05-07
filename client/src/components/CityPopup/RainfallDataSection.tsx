import { memo } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import RainfallGraph from './graphs/RainfallGraph';
import WeatherDataSection from './WeatherDataSection';
import ComponentErrorBoundary from '../ErrorBoundary/ComponentErrorBoundary';
import { hasPrecipitationData } from '@/utils/precipitation/hasPrecipitationData';

interface RainfallDataSectionProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  selectedDate?: string;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const RainfallDataSection = ({
  weeklyWeatherData,
  isLoading,
  hasError,
  comparisonWeeklyWeatherData,
  selectedDate,
  onHover,
}: RainfallDataSectionProps) => {
  // check if there's actual precipitation data (not just empty objects)
  const hasMainPrecipData = hasPrecipitationData(weeklyWeatherData);
  const hasCompPrecipData = hasPrecipitationData(comparisonWeeklyWeatherData);

  // pass null if no precipitation data exists to trigger the no-data badge
  const dataToPass = hasMainPrecipData ? weeklyWeatherData : null;
  const compDataToPass = hasCompPrecipData ? comparisonWeeklyWeatherData : null;

  return (
    <WeatherDataSection
      data={dataToPass}
      comparisonData={compDataToPass}
      isLoading={isLoading}
      hasError={hasError}
      errorMessage="Failed to load precipitation data for this city."
      showNoDataBadge={true}
      noDataMessage="No precipitation data available"
    >
      {(data) => (
        <ComponentErrorBoundary componentName="RainfallGraph">
          {/* Pass the unfiltered comparison data — the graph filters
              empty rows internally, and the no-data badge is driven from
              the section-level `compDataToPass` instead. */}
          <RainfallGraph
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

export default memo(RainfallDataSection);
