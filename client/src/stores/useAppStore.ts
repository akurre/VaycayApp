import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HomeLocation } from '@/types/userLocationType';
import type { WeatherDataUnion } from '@/types/mapTypes';

interface AppState {
  homeLocation: HomeLocation | null;
  setHomeLocation: (location: HomeLocation | null) => void;
  homeCityData: WeatherDataUnion | null;
  setHomeCityData: (data: WeatherDataUnion | null) => void;
  isLocationLoading: boolean;
  setIsLocationLoading: (loading: boolean) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      homeLocation: null,
      setHomeLocation: (homeLocation) => set({ homeLocation }),
      homeCityData: null,
      setHomeCityData: (homeCityData) => set({ homeCityData }),
      isLocationLoading: false,
      setIsLocationLoading: (isLocationLoading) => set({ isLocationLoading }),
      locationError: null,
      setLocationError: (locationError) => set({ locationError }),
    }),
    {
      name: 'app-storage',
      // only persist homeLocation, not loading/error states or weather data
      partialize: (state) => ({ homeLocation: state.homeLocation }),
    }
  )
);
