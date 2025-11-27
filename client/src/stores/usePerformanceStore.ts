import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PerformanceMetric } from '@/utils/performance/performanceMonitor';

interface PerformanceState {
  // Dashboard visibility
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;

  // Persisted metrics (with limit to prevent quota issues)
  metrics: PerformanceMetric[];
  setMetrics: (metrics: PerformanceMetric[]) => void;
  addMetric: (metric: PerformanceMetric) => void;
  clearMetrics: () => void;
}

// Maximum number of metrics to keep in storage (prevent quota exceeded)
const MAX_STORED_METRICS = 100;

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set) => ({
      isVisible: false,
      setIsVisible: (isVisible) => set({ isVisible }),

      metrics: [],
      setMetrics: (metrics) => set({ metrics }),
      addMetric: (metric) =>
        set((state) => {
          // Keep only the most recent metrics to prevent localStorage quota issues
          const newMetrics = [...state.metrics, metric];
          if (newMetrics.length > MAX_STORED_METRICS) {
            // Remove oldest metrics, keep most recent
            return { metrics: newMetrics.slice(-MAX_STORED_METRICS) };
          }
          return { metrics: newMetrics };
        }),
      clearMetrics: () => set({ metrics: [] }),
    }),
    {
      name: 'performance-dashboard-storage',
      // Persist everything
      partialize: (state) => ({
        isVisible: state.isVisible,
        // Only persist a limited number of metrics
        metrics: state.metrics.slice(-MAX_STORED_METRICS),
      }),
      // Handle storage errors gracefully
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate performance store:', error);
          // Clear metrics on error to recover
          if (state) {
            state.metrics = [];
          }
        }
      },
    }
  )
);
