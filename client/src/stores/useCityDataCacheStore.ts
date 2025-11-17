import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';

interface CachedCityData {
  weatherData: WeatherData | null;
  sunshineData: SunshineData | null;
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
    sunshineData: SunshineData | null
  ) => void;

  // Get a city from the cache
  getFromCache: (key: string) => CachedCityData | undefined;

  // Clear the entire cache
  clearCache: () => void;
}

export const useCityDataCacheStore = create<CityDataCacheStore>()(
  persist(
    (set, get) => ({
      cache: {},
      maxCacheSize: 30, // Store up to 30 cities
      recentlyUsed: [],

      addToCache: (key, weatherData, sunshineData) =>
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

          // Add or update the cache entry
          newCache[key] = {
            weatherData,
            sunshineData,
            timestamp: Date.now(),
          };

          return {
            cache: newCache,
            recentlyUsed: newRecentlyUsed,
          };
        }),

      getFromCache: (key) => {
        const state = get();
        const cachedData = state.cache[key];

        if (cachedData) {
          // Update recently used list (move this key to the end)
          set((state) => {
            const newRecentlyUsed = state.recentlyUsed.filter((k) => k !== key);
            newRecentlyUsed.push(key);
            return { recentlyUsed: newRecentlyUsed };
          });
        }

        return cachedData;
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
