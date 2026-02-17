import { useRef, useEffect, useState } from 'react';
import type { DataType } from '@/types/mapTypes';
import { TIER2_ESCALATION_MS } from '@/const';

export interface UseLoadingTierProps {
  isLoading: boolean;
  debouncedDate: string | undefined;
  selectedMonth: number;
  dataType: DataType;
  isBasemapLoaded: boolean;
}

export type LoadingTier = 'none' | 'tier1' | 'tier2';

export interface UseLoadingTierReturn {
  tier: LoadingTier;
  isDataChange: boolean;
  isPanLoad: boolean;
}

export const useLoadingTier = ({
  isLoading,
  debouncedDate,
  selectedMonth,
  dataType,
  isBasemapLoaded,
}: UseLoadingTierProps): UseLoadingTierReturn => {
  const prevDebouncedDateRef = useRef(debouncedDate);
  const prevMonthRef = useRef(selectedMonth);
  const prevDataTypeRef = useRef(dataType);
  const prevIsLoadingRef = useRef(isLoading);

  const [isEscalated, setIsEscalated] = useState(false);
  const escalationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive data change status directly (no memoization needed for simple comparison)
  const dataHasChanged =
    prevDebouncedDateRef.current !== debouncedDate ||
    prevMonthRef.current !== selectedMonth ||
    prevDataTypeRef.current !== dataType;

  // Derive raw tier directly (no memoization needed for simple logic)
  const rawTier: LoadingTier = !isLoading
    ? 'none'
    : dataHasChanged || !isBasemapLoaded
      ? 'tier1'
      : 'tier2';

  const tier: LoadingTier =
    rawTier === 'tier2' && isEscalated ? 'tier1' : rawTier;

  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    const isNowLoading = isLoading;

    if (wasLoading && !isNowLoading) {
      prevDebouncedDateRef.current = debouncedDate;
      prevMonthRef.current = selectedMonth;
      prevDataTypeRef.current = dataType;
      setIsEscalated(false);
    }

    prevIsLoadingRef.current = isLoading;
  }, [isLoading, debouncedDate, selectedMonth, dataType]);

  useEffect(() => {
    if (escalationTimerRef.current) {
      clearTimeout(escalationTimerRef.current);
      escalationTimerRef.current = null;
    }

    if (rawTier === 'tier2' && !isEscalated) {
      escalationTimerRef.current = setTimeout(() => {
        setIsEscalated(true);
      }, TIER2_ESCALATION_MS);
    }

    return () => {
      if (escalationTimerRef.current) {
        clearTimeout(escalationTimerRef.current);
        escalationTimerRef.current = null;
      }
    };
  }, [rawTier, isEscalated]);

  const isDataChange = tier === 'tier1' && dataHasChanged;
  const isPanLoad = tier === 'tier2';

  return {
    tier,
    isDataChange,
    isPanLoad,
  };
};
