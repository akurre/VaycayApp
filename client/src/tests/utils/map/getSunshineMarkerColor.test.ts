import { describe, it, expect, vi } from 'vitest';
import getSunshineMarkerColor from '@/utils/map/getSunshineMarkerColor';

// Mock constants
vi.mock('@/constants', () => ({
  SUNSHINE_THRESHOLDS: [
    { hours: 0, color: [100, 100, 100] },
    { hours: 500, color: [150, 150, 150] },
    { hours: 1000, color: [200, 200, 200] },
    { hours: 1500, color: [250, 250, 250] },
  ],
  SUNSHINE_COLOR_RANGE: [
    [100, 100, 100],
    [150, 150, 150],
    [200, 200, 200],
    [250, 250, 250],
  ],
}));

describe('getSunshineMarkerColor', () => {
  it('returns default color for null input', () => {
    const color = getSunshineMarkerColor(null);
    expect(color).toEqual([150, 150, 150]);
  });

  it('returns the first threshold color for minimum value', () => {
    const color = getSunshineMarkerColor(0);
    expect(color).toEqual([100, 100, 100]);
  });

  it('returns the last threshold color for values above maximum threshold', () => {
    const color = getSunshineMarkerColor(2000);
    expect(color).toEqual([250, 250, 250]);
  });

  it('interpolates between thresholds for values in between', () => {
    // Test value halfway between 500 and 1000
    const color = getSunshineMarkerColor(750);

    // Should be halfway between [150, 150, 150] and [200, 200, 200]
    expect(color).toEqual([175, 175, 175]);
  });

  it('interpolates correctly for values near threshold boundaries', () => {
    // Test value 10% of the way from 1000 to 1500
    const color = getSunshineMarkerColor(1050);

    // Should be 10% of the way from [200, 200, 200] to [250, 250, 250]
    expect(color).toEqual([205, 205, 205]);
  });
});
