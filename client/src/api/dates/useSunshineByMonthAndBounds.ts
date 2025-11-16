import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_SUNSHINE_BY_MONTH, GET_SUNSHINE_BY_MONTH_AND_BOUNDS } from '@/api/queries';
import {
  SunshineData,
  SunshineByMonthResponse,
  SunshineByMonthVars,
  SunshineByMonthAndBoundsVars,
} from '@/types/sunshineDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

interface UseSunshineByMonthAndBoundsParams {
  month: number;
  bounds: MapBounds | null;
  shouldUseBounds: boolean;
}

function useSunshineByMonthAndBounds({
  month,
  bounds,
  shouldUseBounds,
}: UseSunshineByMonthAndBoundsParams) {
  const isValidMonth = Number.isInteger(month) && month >= 1 && month <= 12;

  const globalQuery = useQuery<SunshineByMonthResponse, SunshineByMonthVars>(
    GET_SUNSHINE_BY_MONTH,
    {
      variables: { month },
      skip: !isValidMonth || shouldUseBounds,
    }
  );

  const boundsQuery = useQuery<SunshineByMonthResponse, SunshineByMonthAndBoundsVars>(
    GET_SUNSHINE_BY_MONTH_AND_BOUNDS,
    {
      variables: {
        month,
        minLat: bounds?.minLat ?? 0,
        maxLat: bounds?.maxLat ?? 0,
        minLong: bounds?.minLong ?? 0,
        maxLong: bounds?.maxLong ?? 0,
      },
      skip: !isValidMonth || !shouldUseBounds || !bounds,
    }
  );

  const activeQuery = shouldUseBounds ? boundsQuery : globalQuery;

  useEffect(() => {
    if (!shouldUseBounds && globalQuery.error) {
      parseErrorAndNotify(globalQuery.error, 'failed to load sunshine data');
    }
  }, [globalQuery.error, shouldUseBounds]);

  useEffect(() => {
    if (shouldUseBounds && boundsQuery.error) {
      parseErrorAndNotify(boundsQuery.error, 'failed to load sunshine data');
    }
  }, [boundsQuery.error, shouldUseBounds]);

  const sunshineData = shouldUseBounds
    ? activeQuery.data?.sunshineByMonthAndBounds
    : activeQuery.data?.sunshineByMonth;

  return {
    dataReturned: sunshineData,
    isLoading: activeQuery.loading,
    isError: activeQuery.error,
  };
}

export default useSunshineByMonthAndBounds;
