import { describe, it, expect } from 'vitest';
import { getMarkerColor } from '@/utils/map/getMarkerColor';
import { TEMP_THRESHOLDS } from '@/const';

const FIRST = TEMP_THRESHOLDS[0];
const LAST = TEMP_THRESHOLDS[TEMP_THRESHOLDS.length - 1];

describe('getMarkerColor', () => {
  it('clamps to the lowest-threshold color for temperatures at or below the lowest threshold', () => {
    expect(getMarkerColor(FIRST.temp)).toEqual(FIRST.color);
    expect(getMarkerColor(FIRST.temp - 5)).toEqual(FIRST.color);
    expect(getMarkerColor(FIRST.temp - 100)).toEqual(FIRST.color);
  });

  it('clamps to the highest-threshold color for temperatures at or above the highest threshold', () => {
    expect(getMarkerColor(LAST.temp)).toEqual(LAST.color);
    expect(getMarkerColor(LAST.temp + 5)).toEqual(LAST.color);
    expect(getMarkerColor(LAST.temp + 100)).toEqual(LAST.color);
  });

  it('returns exact threshold colors at threshold temperatures', () => {
    TEMP_THRESHOLDS.forEach(({ temp, color }) => {
      expect(getMarkerColor(temp)).toEqual(color);
    });
  });

  it('interpolates colors between thresholds (each channel falls within bracketing thresholds)', () => {
    for (let i = 0; i < TEMP_THRESHOLDS.length - 1; i++) {
      const lower = TEMP_THRESHOLDS[i];
      const upper = TEMP_THRESHOLDS[i + 1];
      const midTemp = (lower.temp + upper.temp) / 2;
      const midColor = getMarkerColor(midTemp);
      [0, 1, 2].forEach((channel) => {
        const min = Math.min(lower.color[channel], upper.color[channel]);
        const max = Math.max(lower.color[channel], upper.color[channel]);
        expect(midColor[channel]).toBeGreaterThanOrEqual(min);
        expect(midColor[channel]).toBeLessThanOrEqual(max);
      });
      expect(midColor).toHaveLength(3);
    }
  });

  it('returns valid RGB values (0-255)', () => {
    const testTemps = [-30, -5, 10, 20, 30, 40, 50];
    testTemps.forEach((temp) => {
      const color = getMarkerColor(temp);
      expect(color).toHaveLength(3);
      color.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
      });
    });
  });

  it('handles typical temperature ranges smoothly', () => {
    const color10 = getMarkerColor(10);
    const color20 = getMarkerColor(20);
    const color30 = getMarkerColor(30);
    expect(color10).not.toEqual(color20);
    expect(color20).not.toEqual(color30);
  });

  it('returns integer RGB values', () => {
    const color = getMarkerColor(12.5);
    color.forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});
