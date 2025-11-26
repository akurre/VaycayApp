// performance monitoring utility for development
// tracks and logs performance metrics with configurable thresholds

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  constructor() {
    // Load persisted metrics on startup (non-blocking)
    if (typeof globalThis.window !== 'undefined' && import.meta.env.DEV) {
      this.loadPersistedMetrics();
    }
  }

  private loadPersistedMetrics(): void {
    // Async load without blocking constructor
    import('@/stores/usePerformanceStore')
      .then(({ usePerformanceStore }) => {
        const persistedMetrics = usePerformanceStore.getState().metrics;
        if (persistedMetrics.length > 0) {
          this.metrics = [...persistedMetrics];
        }
      })
      .catch((err) => {
        console.warn('Failed to load persisted metrics:', err);
      });
  }

  start(name: string): void {
    if (import.meta.env.DEV) {
      this.marks.set(name, performance.now());
      performance.mark(`${name}-start`);
    }
  }

  end(name: string): number | null {
    if (!import.meta.env.DEV) return null;

    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`no start mark found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const metric = {
      name,
      duration,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Also add to Zustand store for persistence
    this.syncToStore(metric);

    this.marks.delete(name);

    // log if duration exceeds threshold
    const threshold = this.getThreshold(name);
    if (duration > threshold) {
      console.warn(
        `⚠️ performance: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }

    return duration;
  }

  private syncToStore(metric: PerformanceMetric): void {
    if (typeof globalThis.window !== 'undefined') {
      import('@/stores/usePerformanceStore')
        .then(({ usePerformanceStore }) => {
          usePerformanceStore.getState().addMetric(metric);
        })
        .catch((err) => {
          console.warn('Failed to sync metric to store:', err);
        });
    }
  }

  private getThreshold(name: string): number {
    // define performance budgets based on current baselines
    const thresholds: Record<string, number> = {
      // Map initialization and loading
      'map-initial-load': 350, // baseline: ~298ms, budget: 350ms
      'map-layer-creation': 100, // layer creation should be fast

      // Color caching (runs during data updates)
      'temperature-color-cache': 50, // color calculations
      'sunshine-color-cache': 50, // color calculations

      // Data transformation
      'heatmap-data-transform': 50, // heatmap data prep

      // Animation performance (per frame)
      'raf-home-animation': 16, // 60fps = 16.67ms per frame

      // Transitions
      'view-mode-transition': 650, // baseline: 600ms transitions, budget: 650ms

      // Legacy/fallback
      'layer-creation': 100,
      'marker-render': 50,
      'color-calculation': 10,
      'query-response': 350,
      'query-response-cached': 10,
      'data-transform': 50,
      'heatmap-generation': 200,
      'bounds-calculation': 50,
    };

    return thresholds[name] || 100;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
    this.marks.clear();

    // Also clear from store
    if (typeof globalThis.window !== 'undefined') {
      import('@/stores/usePerformanceStore')
        .then(({ usePerformanceStore }) => {
          usePerformanceStore.getState().clearMetrics();
        })
        .catch(() => {
          // Ignore errors during clear
        });
    }
  }

  logSummary(): void {
    if (!import.meta.env.DEV) return;

    console.group('📊 performance summary');

    const grouped = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.duration);
        return acc;
      },
      {} as Record<string, number[]>
    );

    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(
        `${name}: avg ${avg.toFixed(2)}ms, min ${min.toFixed(2)}ms, max ${max.toFixed(2)}ms (${durations.length} samples)`
      );
    });

    console.groupEnd();
  }

  // get current performance baselines for documentation
  getBaselines(): Record<string, string> {
    const grouped = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.duration);
        return acc;
      },
      {} as Record<string, number[]>
    );

    const baselines: Record<string, string> = {};

    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      baselines[name] = `~${avg.toFixed(0)}ms (range: ${min.toFixed(0)}-${max.toFixed(0)}ms)`;
    });

    return baselines;
  }
}

export const perfMonitor = new PerformanceMonitor();

// expose to globalThis for easy access in dev tools
if (import.meta.env.DEV) {
  (globalThis as any).perfMonitor = perfMonitor;
}
