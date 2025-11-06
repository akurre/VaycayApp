import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HomeLocation } from '@/types/userLocationType';

interface AppState {
  homeLocation: HomeLocation | null;
  setHomeLocation: (location: HomeLocation | null) => void;
  isLocationLoading: boolean;
  setIsLocationLoading: (loading: boolean) => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      homeLocation: null,
      setHomeLocation: (location) => set({ homeLocation: location }),
      isLocationLoading: false,
      setIsLocationLoading: (loading) => set({ isLocationLoading: loading }),
      locationError: null,
      setLocationError: (error) => set({ locationError: error }),
    }),
    {
      name: 'app-storage',
      // only persist homeLocation, not loading/error states
      partialize: (state) => ({ homeLocation: state.homeLocation }),
    }
  )
);
