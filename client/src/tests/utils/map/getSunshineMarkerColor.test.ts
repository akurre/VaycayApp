import { describe, it, expect } from 'vitest';
import getSunshineMarkerColor from '@/utils/map/getSunshineMarkerColor';

describe('getSunshineMarkerColor', () => {
  it('returns default gray color for null input', () => {
    expect(getSunshineMarkerColor(null)).toEqual([150, 150, 150]);
  });

  it('returns first threshold color for values below first threshold', () => {
    // values below 0 should use the first threshold color [100, 20, 150]
    expect(getSunshineMarkerColor(-10)).toEqual([100, 20, 150]);
  });

  it('returns first threshold color for value at first threshold', () => {
    // value at 0 hours should return first threshold color
    expect(getSunshineMarkerColor(0)).toEqual([100, 20, 150]);
  });

  it('returns last threshold color for values at or above last threshold', () => {
    // values at or above 380 should use the last threshold color [220, 0, 0]
    expect(getSunshineMarkerColor(380)).toEqual([220, 0, 0]);
    expect(getSunshineMarkerColor(500)).toEqual([220, 0, 0]);
  });

  it('interpolates between first and second threshold (0-25)', () => {
    // value at 12.5 (halfway between 0 and 25)
    // should interpolate between [100, 20, 150] and [70, 40, 190]
    const color = getSunshineMarkerColor(12.5);
    expect(color).toEqual([85, 30, 170]);
  });

  it('interpolates between second and third threshold (25-50)', () => {
    // value at 37.5 (halfway between 25 and 50)
    // should interpolate between [70, 40, 190] and [0, 120, 200]
    const color = getSunshineMarkerColor(37.5);
    expect(color).toEqual([35, 80, 195]);
  });

  it('interpolates between middle thresholds (110-140)', () => {
    // value at 125 (halfway between 110 and 140)
    // should interpolate between [60, 140, 40] and [100, 200, 0]
    const color = getSunshineMarkerColor(125);
    expect(color).toEqual([80, 170, 20]);
  });

  it('interpolates between high thresholds (300-340)', () => {
    // value at 320 (halfway between 300 and 340)
    // should interpolate between [255, 69, 0] and [255, 20, 0]
    const color = getSunshineMarkerColor(320);
    expect(color).toEqual([255, 45, 0]);
  });

  it('returns exact threshold colors at boundary values', () => {
    expect(getSunshineMarkerColor(25)).toEqual([70, 40, 190]);
    expect(getSunshineMarkerColor(50)).toEqual([0, 120, 200]);
    expect(getSunshineMarkerColor(110)).toEqual([60, 140, 40]);
    expect(getSunshineMarkerColor(180)).toEqual([173, 255, 47]);
    expect(getSunshineMarkerColor(260)).toEqual([255, 165, 0]);
  });

  it('handles edge case near threshold boundaries', () => {
    // value just above a threshold should interpolate correctly
    const color = getSunshineMarkerColor(181);
    // should be very close to [173, 255, 47] but slightly interpolated toward next threshold
    expect(color[0]).toBeGreaterThanOrEqual(173);
    expect(color[1]).toBeGreaterThanOrEqual(255);
  });
});
