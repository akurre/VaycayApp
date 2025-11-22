import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_SUNSHINE_BY_MONTH, GET_SUNSHINE_BY_MONTH_AND_BOUNDS } from '@/api/queries';
import {
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
      variables: bounds
        ? {
            month,
            minLat: bounds.minLat,
            maxLat: bounds.maxLat,
            minLong: bounds.minLong,
            maxLong: bounds.maxLong,
          }
        : {
            month,
            minLat: 0,
            maxLat: 0,
            minLong: 0,
            maxLong: 0,
          },
      skip: !isValidMonth || !shouldUseBounds || !bounds,
    }
  );

  const activeQuery = shouldUseBounds ? boundsQuery : globalQuery;

  // Handle errors from the active query
  useEffect(() => {
    if (activeQuery.error) {
      parseErrorAndNotify(activeQuery.error, 'failed to load sunshine data');
    }
  }, [activeQuery.error]);

  // Extract data based on which query is active
  const sunshineData = shouldUseBounds
    ? boundsQuery.data?.sunshineByMonthAndBounds
    : globalQuery.data?.sunshineByMonth;

  return {
    dataReturned: sunshineData,
    isLoading: activeQuery.loading,
    isError: activeQuery.error,
  };
}

export default useSunshineByMonthAndBounds;
