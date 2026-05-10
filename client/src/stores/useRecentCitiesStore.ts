import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { RECENT_CITIES_MAX } from '@/const';

interface RecentCitiesState {
  recentCities: SearchCitiesResult[];
  pushRecentCity: (city: SearchCitiesResult) => void;
}

export const useRecentCitiesStore = create<RecentCitiesState>()(
  persist(
    (set) => ({
      recentCities: [],
      pushRecentCity: (city) =>
        set((state) => {
          const deduped = state.recentCities.filter((c) => c.id !== city.id);
          return {
            recentCities: [city, ...deduped].slice(0, RECENT_CITIES_MAX),
          };
        }),
    }),
    {
      name: 'recent-cities-storage',
      partialize: (state) => ({ recentCities: state.recentCities }),
    }
  )
);
