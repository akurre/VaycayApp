import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { CITY_CACHE_MAX_SIZE } from '@/const';

interface CachedCityData {
  weatherData: WeatherData | null;
  sunshineData: SunshineData | null;
  weeklyWeatherData: CityWeeklyWeather | null;
  timestamp: number;
}

interface CityDataCacheStore {
  // Cache with city identifier as key
  cache: Record<string, CachedCityData>;

  // Maximum number of cities to cache
  maxCacheSize: number;

  // Ordered list of keys by recency (most recent at the end)
  recentlyUsed: string[];

  // Add or update a city in the cache
  addToCache: (
    key: string,
    weatherData: WeatherData | null,
    sunshineData: SunshineData | null,
    weeklyWeatherData?: CityWeeklyWeather | null
  ) => void;

  // Get a city from the cache
  getFromCache: (key: string) => CachedCityData | undefined;

  // Mark a cache key as recently used (for LRU tracking)
  markAsRecentlyUsed: (key: string) => void;

  // Clear the entire cache
  clearCache: () => void;
}

export const useCityDataCacheStore = create<CityDataCacheStore>()(
  persist(
    (set, get) => ({
      cache: {},
      maxCacheSize: CITY_CACHE_MAX_SIZE,
      recentlyUsed: [],

      addToCache: (key, weatherData, sunshineData, weeklyWeatherData = null) =>
        set((state) => {
          // Create a copy of the current cache
          const newCache = { ...state.cache };

          // Create a copy of the recently used list
          let newRecentlyUsed = [...state.recentlyUsed];

          // If the key already exists, remove it from the recently used list
          newRecentlyUsed = newRecentlyUsed.filter((k) => k !== key);

          // Add the key to the end of the recently used list (most recent)
          newRecentlyUsed.push(key);

          // If we've exceeded the max cache size, remove the least recently used item
          if (newRecentlyUsed.length > state.maxCacheSize) {
            const keyToRemove = newRecentlyUsed.shift(); // Remove the oldest key
            if (keyToRemove) {
              delete newCache[keyToRemove]; // Remove from cache
            }
          }

          // Get existing cache entry to preserve data when updating
          const existing = state.cache[key];

          // Add or update the cache entry, merging with existing data
          newCache[key] = {
            weatherData: weatherData ?? existing?.weatherData ?? null,
            sunshineData: sunshineData ?? existing?.sunshineData ?? null,
            weeklyWeatherData:
              weeklyWeatherData ?? existing?.weeklyWeatherData ?? null,
            timestamp: Date.now(),
          };

          return {
            cache: newCache,
            recentlyUsed: newRecentlyUsed,
          };
        }),

      getFromCache: (key) => {
        const state = get();
        return state.cache[key];
      },

      // Separate method to update recency - should be called in useEffect
      markAsRecentlyUsed: (key) => {
        set((state) => {
          const newRecentlyUsed = state.recentlyUsed.filter((k) => k !== key);
          newRecentlyUsed.push(key);
          return { recentlyUsed: newRecentlyUsed };
        });
      },

      clearCache: () => set({ cache: {}, recentlyUsed: [] }),
    }),
    {
      name: 'city-data-cache',
      partialize: (state) => ({
        cache: state.cache,
        recentlyUsed: state.recentlyUsed,
        maxCacheSize: state.maxCacheSize,
      }),
    }
  )
);
