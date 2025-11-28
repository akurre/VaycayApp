import { useEffect, useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Progress,
  Badge,
  Button,
  ActionIcon,
} from '@mantine/core';
import { perfMonitor } from '@/utils/performance/performanceMonitor';
import { usePerformanceStore } from '@/stores/usePerformanceStore';
import { IconBolt } from '@tabler/icons-react';

interface MetricSummary {
  name: string;
  avg: number;
  min: number;
  max: number;
  count: number;
  threshold: number;
  isOverBudget: boolean;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const {
    isVisible,
    setIsVisible,
    metrics: storedMetrics,
    clearMetrics,
  } = usePerformanceStore();

  // Calculate metrics whenever storedMetrics changes
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const calculateMetrics = () => {
      // Use metrics from the store
      const allMetrics = storedMetrics;

      if (allMetrics.length === 0) {
        setMetrics([]);
        return;
      }

      // Group and calculate stats
      const grouped = allMetrics.reduce(
        (acc, metric) => {
          if (!acc[metric.name]) {
            acc[metric.name] = [];
          }
          acc[metric.name].push(metric.duration);
          return acc;
        },
        {} as Record<string, number[]>
      );

      const summaries: MetricSummary[] = Object.entries(grouped).map(
        ([name, durations]) => {
          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          const min = Math.min(...durations);
          const max = Math.max(...durations);
          const threshold = getThresholdForMetric(name);

          return {
            name,
            avg,
            min,
            max,
            count: durations.length,
            threshold,
            isOverBudget: avg > threshold,
          };
        }
      );

      // Sort by name for consistency
      summaries.sort((a, b) => a.name.localeCompare(b.name));

      setMetrics(summaries);
    };

    // Calculate immediately on mount and when storedMetrics changes
    calculateMetrics();

    // Also update every second to catch any async updates
    const interval = setInterval(calculateMetrics, 1000);

    return () => clearInterval(interval);
  }, [storedMetrics]);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey && e.shiftKey) {
        setIsVisible(!isVisible);
      }
    };

    globalThis.addEventListener('keydown', handleKeyPress);
    return () => globalThis.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, setIsVisible]);

  if (!import.meta.env.DEV) return null;

  if (!isVisible) {
    return (
      <ActionIcon
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 10000,
          opacity: 0.1,
        }}
        size="xs"
        variant="filled"
        color="dark"
      >
        <IconBolt />
      </ActionIcon>
    );
  }

  return (
    <Card
      shadow="lg"
      padding="md"
      radius="md"
      withBorder
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="lg" fw={700} c="white">
            Performance Monitor
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              onClick={() => {
                perfMonitor.clear();
                clearMetrics();
              }}
              color="gray"
            >
              Clear
            </Button>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => setIsVisible(false)}
              color="gray"
            >
              Hide
            </Button>
          </Group>
        </Group>

        {metrics.length === 0 && (
          <Text size="sm" c="dimmed">
            No metrics recorded yet. Interact with the app to see performance
            data.
          </Text>
        )}

        {metrics.map((metric) => (
          <Card
            key={metric.name}
            padding="sm"
            radius="sm"
            withBorder
            bg="dark.8"
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500} c="white">
                  {formatMetricName(metric.name)}
                </Text>
                <Badge color={metric.isOverBudget ? 'red' : 'green'} size="sm">
                  {metric.isOverBudget ? '⚠️ Over' : '✓ Good'}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Avg: {metric.avg.toFixed(1)}ms
                </Text>
                <Text size="xs" c="dimmed">
                  Budget: {metric.threshold}ms
                </Text>
              </Group>

              <Progress
                value={(metric.avg / metric.threshold) * 100}
                color={metric.isOverBudget ? 'red' : 'green'}
                size="sm"
              />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Min: {metric.min.toFixed(1)}ms
                </Text>
                <Text size="xs" c="dimmed">
                  Max: {metric.max.toFixed(1)}ms
                </Text>
                <Text size="xs" c="dimmed">
                  Samples: {metric.count}
                </Text>
              </Group>
            </Stack>
          </Card>
        ))}

        <Text size="xs" c="dimmed" ta="center">
          Press Ctrl+Shift+P to toggle • Use console: perfMonitor.logSummary()
        </Text>
      </Stack>
    </Card>
  );
}

function formatMetricName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getThresholdForMetric(name: string): number {
  const thresholds: Record<string, number> = {
    'map-initial-load': 350,
    'map-layer-creation': 100,
    'temperature-color-cache': 50,
    'sunshine-color-cache': 50,
    'heatmap-data-transform': 50,
    'raf-home-animation': 16,
    'view-mode-transition': 650,
  };

  return thresholds[name] || 100;
}
