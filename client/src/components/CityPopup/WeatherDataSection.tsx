import { memo, type ReactNode } from 'react';
import { Alert, Badge, Loader } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface WeatherDataSectionProps<T> {
  data: T | null;
  comparisonData?: T | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  showNoDataBadge?: boolean;
  noDataMessage?: string;
  children: (data: T) => ReactNode;
}

const WeatherDataSectionInner = <T,>({
  data,
  comparisonData,
  isLoading,
  hasError,
  errorMessage,
  showNoDataBadge = false,
  noDataMessage = 'No data available',
  children,
}: WeatherDataSectionProps<T>) => {
  // show graph if either base data or comparison data exists
  const hasAnyData = data ?? comparisonData;

  return (
    <div className="h-full flex flex-col">
      {isLoading && !data && (
        <div className="flex justify-center py-4">
          <Loader size="sm" />
        </div>
      )}

      {hasError && !data && (
        <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
          {errorMessage}
        </Alert>
      )}

      {hasAnyData ? (
        <div className="flex-1 min-h-0 h-full px-3 w-full">
          {children(data!)}
        </div>
      ) : (
        showNoDataBadge && (
          <div className="flex-1 min-h-0 items-center flex justify-center">
            <Badge size="xl">{noDataMessage}</Badge>
          </div>
        )
      )}
    </div>
  );
};

const WeatherDataSection = memo(
  WeatherDataSectionInner
) as typeof WeatherDataSectionInner;

export default WeatherDataSection;
