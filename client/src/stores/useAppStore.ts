import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HomeLocation } from '@/types/userLocationType';
import type { MapViewport, WeatherDataUnion } from '@/types/mapTypes';
import { TemperatureUnit } from '@/types/mapTypes';

interface AppState {
  homeLocation: HomeLocation | null;
  setHomeLocation: (location: HomeLocation | null) => void;
  homeCityData: WeatherDataUnion | null;
  setHomeCityData: (data: WeatherDataUnion | null) => void;
  isLocationLoading: boolean;
  setIsLocationLoading: (loading: boolean) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
  hasSeenWelcomeModal: boolean;
  setHasSeenWelcomeModal: (seen: boolean) => void;
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  mapViewport: MapViewport | null;
  setMapViewport: (viewport: MapViewport) => void;
  resetHomeLocation: () => void;
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
      hasSeenWelcomeModal: false,
      setHasSeenWelcomeModal: (hasSeenWelcomeModal) =>
        set({ hasSeenWelcomeModal }),
      temperatureUnit: TemperatureUnit.Celsius,
      setTemperatureUnit: (temperatureUnit) => set({ temperatureUnit }),
      mapViewport: null,
      setMapViewport: (mapViewport) => set({ mapViewport }),
      resetHomeLocation: () =>
        set({
          homeLocation: null,
          homeCityData: null,
          locationError: null,
          isLocationLoading: false,
        }),
    }),
    {
      name: 'app-storage',
      // only persist homeLocation, temperature unit, and welcome modal state, not loading/error states or weather data
      partialize: (state) => ({
        homeLocation: state.homeLocation,
        hasSeenWelcomeModal: state.hasSeenWelcomeModal,
        temperatureUnit: state.temperatureUnit,
      }),
    }
  )
);
