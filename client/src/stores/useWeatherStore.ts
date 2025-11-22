import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeatherData } from '../types/cityWeatherDataType';
import { MAX_CITIES_SHOWN } from '@/const';

interface WeatherStore {
  displayedWeatherData: WeatherData[] | null;
  isLoadingWeather: boolean;
  maxCitiesToShow: number; // For future user adjustment
  setDisplayedWeatherData: (data: WeatherData[] | null) => void;
  setIsLoadingWeather: (isLoading: boolean) => void;
  setMaxCitiesToShow: (count: number) => void;
}

export const useWeatherStore = create<WeatherStore>()(
  persist(
    (set) => ({
      displayedWeatherData: null,
      isLoadingWeather: false,
      maxCitiesToShow: MAX_CITIES_SHOWN,
      setDisplayedWeatherData: (data) => set({ displayedWeatherData: data }),
      setIsLoadingWeather: (isLoading) => set({ isLoadingWeather: isLoading }),
      setMaxCitiesToShow: (count) => set({ maxCitiesToShow: count }),
    }),
    {
      name: 'weather-storage',
      // only persist maxCitiesToShow, not the data or loading states
      partialize: (state) => ({ maxCitiesToShow: state.maxCitiesToShow }),
    }
  )
);
