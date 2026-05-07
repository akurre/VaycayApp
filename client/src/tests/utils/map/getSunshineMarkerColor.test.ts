import { describe, it, expect } from 'vitest';
import getSunshineMarkerColor from '@/utils/map/getSunshineMarkerColor';

describe('getSunshineMarkerColor', () => {
  it('returns default gray color for null input', () => {
    expect(getSunshineMarkerColor(null)).toEqual([150, 150, 150]);
  });

  it('returns first threshold color for values below first threshold', () => {
    // values below 0% should use the first threshold color [100, 20, 150]
    expect(getSunshineMarkerColor(-10)).toEqual([100, 20, 150]);
  });

  it('returns first threshold color for value at first threshold', () => {
    // value at 0% should return first threshold color
    expect(getSunshineMarkerColor(0)).toEqual([100, 20, 150]);
  });

  it('returns last threshold color for values at or above last threshold', () => {
    // values at or above 85% should use the last threshold color [220, 0, 0]
    expect(getSunshineMarkerColor(85)).toEqual([220, 0, 0]);
    expect(getSunshineMarkerColor(150)).toEqual([220, 0, 0]);
  });

  it('interpolates between first and second threshold (0%-15%)', () => {
    // value at 7.5 (halfway between 0 and 15)
    // should interpolate between [100, 20, 150] and [70, 40, 190]
    const color = getSunshineMarkerColor(7.5);
    expect(color).toEqual([85, 30, 170]);
  });

  it('interpolates between second and third threshold (15%-25%)', () => {
    // value at 20 (halfway between 15 and 25)
    // should interpolate between [70, 40, 190] and [0, 120, 200]
    const color = getSunshineMarkerColor(20);
    expect(color).toEqual([35, 80, 195]);
  });

  it('interpolates between middle thresholds (45%-50%)', () => {
    // value at 47.5 (halfway between 45 and 50)
    // should interpolate between [60, 140, 40] and [100, 200, 0]
    const color = getSunshineMarkerColor(47.5);
    expect(color).toEqual([80, 170, 20]);
  });

  it('interpolates between high thresholds (70%-80%)', () => {
    // value at 75 (halfway between 70 and 80)
    // should interpolate between [255, 69, 0] and [255, 20, 0]
    const color = getSunshineMarkerColor(75);
    expect(color).toEqual([255, 45, 0]);
  });

  it('returns exact threshold colors at boundary values', () => {
    expect(getSunshineMarkerColor(15)).toEqual([70, 40, 190]);
    expect(getSunshineMarkerColor(25)).toEqual([0, 120, 200]);
    expect(getSunshineMarkerColor(45)).toEqual([60, 140, 40]);
    expect(getSunshineMarkerColor(55)).toEqual([173, 255, 47]);
    expect(getSunshineMarkerColor(65)).toEqual([255, 165, 0]);
  });

  it('handles edge case near threshold boundaries', () => {
    // value just above a threshold should interpolate correctly
    const color = getSunshineMarkerColor(56);
    // should be very close to [173, 255, 47] but slightly interpolated toward next
    expect(color[0]).toBeGreaterThanOrEqual(173);
    expect(color[1]).toBeLessThanOrEqual(255);
  });
});
