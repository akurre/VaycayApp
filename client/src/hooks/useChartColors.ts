import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useMemo } from 'react';

/**
 * Hook that provides theme-aware colors for charts
 * Colors automatically adapt to light/dark mode
 */
export const useChartColors = () => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  return useMemo(() => {
    const isDark = colorScheme === 'dark';

    return {
      // Line colors
      lineColor: theme.colors['secondary-teal'][5], // stays consistent
      maxLineColor: theme.colors['primary-red'][5], // stays consistent
      minLineColor: isDark ? '#6b7280' : '#9ca3af', // lighter in light mode

      // Grid and axis colors
      gridColor: isDark ? '#374151' : '#e5e7eb', // darker in dark mode, light in light mode
      axisColor: isDark ? '#6b7280' : '#4b5563', // medium gray, darker in light mode for contrast

      // Text colors for labels
      textColor: isDark ? '#d1d5db' : '#374151', // light text in dark mode, dark text in light mode

      // Background color for tooltips and other overlays
      backgroundColor: isDark ? '#1f2937' : '#ffffff', // dark gray in dark mode, white in light mode
    };
  }, [colorScheme, theme]);
};
