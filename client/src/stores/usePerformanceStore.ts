import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PerformanceMetric } from '@/utils/performance/performanceMonitor';

interface PerformanceState {
  // Dashboard visibility
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;

  // Persisted metrics
  metrics: PerformanceMetric[];
  setMetrics: (metrics: PerformanceMetric[]) => void;
  addMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      isVisible: false,
      setIsVisible: (isVisible) => set({ isVisible }),

      metrics: [],
      setMetrics: (metrics) => set({ metrics }),
      addMetric: (metric) => set((state) => ({
        metrics: [...state.metrics, metric]
      })),
      clearMetrics: () => set({ metrics: [] }),
    }),
    {
      name: 'performance-dashboard-storage',
      // Persist everything
      partialize: (state) => ({
        isVisible: state.isVisible,
        metrics: state.metrics,
      }),
    }
  )
);
