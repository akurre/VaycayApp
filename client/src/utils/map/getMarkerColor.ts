import { TEMP_THRESHOLDS, COLOR_RANGE } from '@/const';

// interpolate between two colors
function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * factor),
    Math.round(color1[1] + (color2[1] - color1[1]) * factor),
    Math.round(color1[2] + (color2[2] - color1[2]) * factor),
  ];
}

export const getMarkerColor = (temp: number): [number, number, number] => {
  // handle extreme cold (below lowest threshold)
  if (temp <= TEMP_THRESHOLDS[0].temp) {
    return TEMP_THRESHOLDS[0].color;
  }

  // handle extreme heat (above highest threshold)
  if (temp >= TEMP_THRESHOLDS[TEMP_THRESHOLDS.length - 1].temp) {
    return TEMP_THRESHOLDS[TEMP_THRESHOLDS.length - 1].color;
  }

  // find the two thresholds to interpolate between
  for (let i = 0; i < TEMP_THRESHOLDS.length - 1; i++) {
    const lower = TEMP_THRESHOLDS[i];
    const upper = TEMP_THRESHOLDS[i + 1];

    if (temp >= lower.temp && temp <= upper.temp) {
      // calculate interpolation factor (0 to 1)
      const factor = (temp - lower.temp) / (upper.temp - lower.temp);
      return interpolateColor(lower.color, upper.color, factor);
    }
  }

  // fallback (should never reach here)
  return [128, 128, 128];
};

export { COLOR_RANGE };
