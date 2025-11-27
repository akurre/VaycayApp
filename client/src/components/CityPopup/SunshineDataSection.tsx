import { memo } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import SunshineGraph from './graphs/SunshineGraph';
import WeatherDataSection from './WeatherDataSection';

interface SunshineDataSectionProps {
  displaySunshineData: SunshineData | null;
  isLoading: boolean;
  hasError: boolean;
  selectedMonth: number;
  comparisonSunshineData?: SunshineData | null;
  comparisonIsLoading?: boolean;
  comparisonHasError?: boolean;
}

const SunshineDataSection = ({
  displaySunshineData,
  isLoading,
  hasError,
  selectedMonth,
  comparisonSunshineData,
  comparisonIsLoading,
  comparisonHasError,
}: SunshineDataSectionProps) => {
  return (
    <WeatherDataSection
      data={displaySunshineData}
      isLoading={isLoading}
      hasError={hasError}
      errorMessage="Failed to load sunshine data for this city."
      showNoDataBadge={true}
      noDataMessage="No sunshine data available"
    >
      {(data) => (
        <SunshineGraph
          sunshineData={data}
          selectedMonth={selectedMonth}
          comparisonSunshineData={comparisonSunshineData}
        />
      )}
    </WeatherDataSection>
  );
};

export default memo(SunshineDataSection);
