import { memo } from 'react';
import { Alert, Badge, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { SunshineData } from '@/types/sunshineDataType';
import SunshineGraph from './SunshineGraph';

interface SunshineDataSectionProps {
  displaySunshineData: SunshineData | null;
  isLoading: boolean;
  hasError: boolean;
  selectedMonth: number;
}

const SunshineDataSection = ({
  displaySunshineData,
  isLoading,
  hasError,
  selectedMonth,
}: SunshineDataSectionProps) => {
  return (
    <div className="h-full flex flex-col">
      {isLoading && !displaySunshineData && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !displaySunshineData && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          Failed to load sunshine data for this city.
        </Alert>
      )}

      {displaySunshineData ? (
        <div className="flex-1 min-h-0 p-3">
          <SunshineGraph sunshineData={displaySunshineData} selectedMonth={selectedMonth} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 items-center flex justify-center">
          <Badge size="xl">No sunshine data available</Badge>
        </div>
      )}
    </div>
  );
};

export default memo(SunshineDataSection);
