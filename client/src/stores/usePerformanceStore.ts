import { create } from 'zustand';
import type { PerformanceMetric } from '@/utils/performance/performanceMonitor';

// In-memory only. Was previously wrapped in zustand/persist + localStorage,
// but every perfMonitor.end() during a layer rebuild fired a JSON.stringify +
// localStorage.setItem on the (growing) metrics array, which on long dev
// sessions stalled gestures by 5-50 ms per write. The dashboard still works
// from the in-memory copy; metrics just don't survive a reload.

interface PerformanceState {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;

  metrics: PerformanceMetric[];
  setMetrics: (metrics: PerformanceMetric[]) => void;
  addMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;
}

const MAX_STORED_METRICS = 100;

export const usePerformanceStore = create<PerformanceState>()((set) => ({
  isVisible: false,
  setIsVisible: (isVisible) => set({ isVisible }),

  metrics: [],
  setMetrics: (metrics) => set({ metrics }),
  addMetric: (metric) =>
    set((state) => {
      const newMetrics = [...state.metrics, metric];
      if (newMetrics.length > MAX_STORED_METRICS) {
        return { metrics: newMetrics.slice(-MAX_STORED_METRICS) };
      }
      return { metrics: newMetrics };
    }),
  clearMetrics: () => set({ metrics: [] }),
}));
