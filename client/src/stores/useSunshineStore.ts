import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SunshineData } from '../types/sunshineDataType';
import { MAX_CITIES_SHOWN } from '@/const';

interface SunshineStore {
  displayedSunshineData: SunshineData[] | null;
  isLoadingSunshine: boolean;
  maxCitiesToShow: number; // For future user adjustment
  setDisplayedSunshineData: (data: SunshineData[] | null) => void;
  setIsLoadingSunshine: (isLoading: boolean) => void;
  setMaxCitiesToShow: (count: number) => void;
}

export const useSunshineStore = create<SunshineStore>()(
  persist(
    (set) => ({
      displayedSunshineData: null,
      isLoadingSunshine: false,
      maxCitiesToShow: MAX_CITIES_SHOWN,
      setDisplayedSunshineData: (data) => set({ displayedSunshineData: data }),
      setIsLoadingSunshine: (isLoading) =>
        set({ isLoadingSunshine: isLoading }),
      setMaxCitiesToShow: (count) => set({ maxCitiesToShow: count }),
    }),
    {
      name: 'sunshine-storage',
      // persist maxCitiesToShow
      partialize: (state) => ({ maxCitiesToShow: state.maxCitiesToShow }),
    }
  )
);
