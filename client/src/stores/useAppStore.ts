import { create } from 'zustand';
import { MapTheme } from '@/types/mapTypes';

interface AppState {
  theme: MapTheme;
  setTheme: (theme: MapTheme) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: MapTheme.Dark,
  setTheme: (theme) => set({ theme }),
}));
