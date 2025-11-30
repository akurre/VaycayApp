import { memo } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import SunshineGraph from './graphs/SunshineGraph';
import WeatherDataSection from './WeatherDataSection';
import ComponentErrorBoundary from '../ErrorBoundary/ComponentErrorBoundary';

interface SunshineDataSectionProps {
  displaySunshineData: SunshineData | null;
  isLoading: boolean;
  hasError: boolean;
  selectedMonth: number;
  comparisonSunshineData?: SunshineData | null;
}

const SunshineDataSection = ({
  displaySunshineData,
  isLoading,
  hasError,
  selectedMonth,
  comparisonSunshineData,
}: SunshineDataSectionProps) => {
  return (
    <WeatherDataSection
      data={displaySunshineData}
      comparisonData={comparisonSunshineData}
      isLoading={isLoading}
      hasError={hasError}
      errorMessage="Failed to load sunshine data for this city."
      showNoDataBadge={true}
      noDataMessage="No sunshine data available"
    >
      {(data) => (
        <ComponentErrorBoundary componentName="SunshineGraph">
          <SunshineGraph
            sunshineData={data}
            selectedMonth={selectedMonth}
            comparisonSunshineData={comparisonSunshineData}
          />
        </ComponentErrorBoundary>
      )}
    </WeatherDataSection>
  );
};

export default memo(SunshineDataSection);
