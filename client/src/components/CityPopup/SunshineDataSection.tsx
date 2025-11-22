import { memo } from 'react';
import { Alert, Loader } from '@mantine/core';
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
    <>
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

      {displaySunshineData && (
        <div className='h-full p-3'>
          <SunshineGraph sunshineData={displaySunshineData} selectedMonth={selectedMonth} />
        </div>
      )}
    </>
  );
};

export default memo(SunshineDataSection);
