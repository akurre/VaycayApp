import { describe, it, expect } from 'vitest';
import getSunshineMarkerColor from '@/utils/map/getSunshineMarkerColor';
import { SUNSHINE_THRESHOLDS } from '@/const';

const FIRST = SUNSHINE_THRESHOLDS[0];
const LAST = SUNSHINE_THRESHOLDS[SUNSHINE_THRESHOLDS.length - 1];
const NULL_GRAY: [number, number, number] = [150, 150, 150];

describe('getSunshineMarkerColor', () => {
  it('returns the gray sentinel for null input', () => {
    expect(getSunshineMarkerColor(null)).toEqual(NULL_GRAY);
  });

  it('clamps to the first-threshold color for values below the first threshold', () => {
    expect(getSunshineMarkerColor(FIRST.percent - 10)).toEqual([
      ...FIRST.color,
    ]);
    expect(getSunshineMarkerColor(FIRST.percent - 1)).toEqual([...FIRST.color]);
  });

  it('returns the first-threshold color exactly at the first threshold', () => {
    expect(getSunshineMarkerColor(FIRST.percent)).toEqual([...FIRST.color]);
  });

  it('clamps to the last-threshold color for values at or above the last threshold', () => {
    expect(getSunshineMarkerColor(LAST.percent)).toEqual([...LAST.color]);
    expect(getSunshineMarkerColor(LAST.percent + 5)).toEqual([...LAST.color]);
    expect(getSunshineMarkerColor(150)).toEqual([...LAST.color]);
  });

  it('returns exact threshold colors at every threshold percent (except the saturated last threshold)', () => {
    // every threshold up to but not including the last must round-trip exactly;
    // the last threshold is the clamp ceiling, exercised separately above
    SUNSHINE_THRESHOLDS.slice(0, -1).forEach(({ percent, color }) => {
      expect(getSunshineMarkerColor(percent)).toEqual([...color]);
    });
  });

  it('interpolates between adjacent thresholds (each channel within bracketing thresholds)', () => {
    for (let i = 0; i < SUNSHINE_THRESHOLDS.length - 1; i++) {
      const lower = SUNSHINE_THRESHOLDS[i];
      const upper = SUNSHINE_THRESHOLDS[i + 1];
      const midPercent = (lower.percent + upper.percent) / 2;
      const midColor = getSunshineMarkerColor(midPercent);
      [0, 1, 2].forEach((channel) => {
        const min = Math.min(lower.color[channel], upper.color[channel]);
        const max = Math.max(lower.color[channel], upper.color[channel]);
        expect(midColor[channel]).toBeGreaterThanOrEqual(min);
        expect(midColor[channel]).toBeLessThanOrEqual(max);
      });
      expect(midColor).toHaveLength(3);
    }
  });

  it('returns integer RGB values for non-integer percents', () => {
    const color = getSunshineMarkerColor(7.5);
    color.forEach((value) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  it('returns valid RGB channels (0-255) across the full sweep', () => {
    [0, 25, 50, 75, 100].forEach((percent) => {
      const color = getSunshineMarkerColor(percent);
      expect(color).toHaveLength(3);
      color.forEach((channel) => {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      });
    });
  });
});
