import { SUNSHINE_THRESHOLDS } from '@/constants';

/**
 * Determines the color for a marker based on sunshine hours
 * Uses a gradient scale defined in constants
 */
const getSunshineMarkerColor = (sunshineHours: number | null): [number, number, number] => {
  if (sunshineHours === null) {
    // Default color for null values (gray)
    return [150, 150, 150];
  }

  // Handle values below the first threshold
  if (sunshineHours < SUNSHINE_THRESHOLDS[0].hours) {
    // Use the first threshold color for values below the first threshold
    return [...SUNSHINE_THRESHOLDS[0].color];
  }

  // Handle values above the last threshold
  if (sunshineHours >= SUNSHINE_THRESHOLDS[SUNSHINE_THRESHOLDS.length - 1].hours) {
    // Use the last threshold color for values above the last threshold
    return [...SUNSHINE_THRESHOLDS[SUNSHINE_THRESHOLDS.length - 1].color];
  }

  // Find the appropriate color threshold
  for (let i = 1; i < SUNSHINE_THRESHOLDS.length; i++) {
    const prevThreshold = SUNSHINE_THRESHOLDS[i - 1];
    const currThreshold = SUNSHINE_THRESHOLDS[i];

    if (sunshineHours >= prevThreshold.hours && sunshineHours < currThreshold.hours) {
      // Calculate interpolation factor between the two threshold colors
      const range = currThreshold.hours - prevThreshold.hours;
      const factor = range > 0 ? (sunshineHours - prevThreshold.hours) / range : 0;

      // Interpolate between colors
      return [
        Math.round(
          prevThreshold.color[0] + factor * (currThreshold.color[0] - prevThreshold.color[0])
        ),
        Math.round(
          prevThreshold.color[1] + factor * (currThreshold.color[1] - prevThreshold.color[1])
        ),
        Math.round(
          prevThreshold.color[2] + factor * (currThreshold.color[2] - prevThreshold.color[2])
        ),
      ];
    }
  }

  // This should never happen due to the checks above, but as a fallback
  // use the middle threshold color
  const middleIndex = Math.floor(SUNSHINE_THRESHOLDS.length / 2);
  return [...SUNSHINE_THRESHOLDS[middleIndex].color];
};

export default getSunshineMarkerColor;
