import { Alert, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { SunshineData } from '@/types/sunshineDataType';
import SunshineSection from './SunshineSection';

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
        <SunshineSection sunshineData={displaySunshineData} selectedMonth={selectedMonth} />
      )}
    </>
  );
};

export default SunshineDataSection;
