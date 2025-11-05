import { create } from 'zustand';
import { MapTheme } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';

interface AppState {
  theme: MapTheme;
  setTheme: (theme: MapTheme) => void;
  homeLocation: HomeLocation | null;
  setHomeLocation: (location: HomeLocation | null) => void;
  isLocationLoading: boolean;
  setIsLocationLoading: (loading: boolean) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: MapTheme.Dark,
  setTheme: (theme) => set({ theme }),
  homeLocation: null,
  setHomeLocation: (location) => set({ homeLocation: location }),
  isLocationLoading: false,
  setIsLocationLoading: (loading) => set({ isLocationLoading: loading }),
  locationError: null,
  setLocationError: (error) => set({ locationError: error }),
}));
