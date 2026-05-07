import { describe, it, expect } from 'vitest';
import { buildTodayDot } from '@/components/CityPopup/graphs/utils/buildTodayDot';
import { appColors } from '@/theme';

describe('buildTodayDot', () => {
  it('returns a config with the provided coordinates', () => {
    const dot = buildTodayDot(7, 42);
    expect(dot.x).toBe(7);
    expect(dot.y).toBe(42);
  });

  it('uses the theme default-border CSS variable so the stroke is visible in both modes', () => {
    const dot = buildTodayDot(7, 42);
    expect(dot.stroke).toBe('var(--mantine-color-default-border)');
  });

  it('uses the theme paper color for fill by default so today markers read as a hollow cream disc', () => {
    const dot = buildTodayDot(7, 42);
    expect(dot.fill).toBe(appColors.light.paper);
  });

  it('uses a caller-supplied fill (used in comparison mode for city-shaded today dots)', () => {
    const dot = buildTodayDot(7, 42, '#C97A24');
    expect(dot.fill).toBe('#C97A24');
  });

  it('accepts a string x value (e.g. month name)', () => {
    const dot = buildTodayDot('Jul', 280);
    expect(dot.x).toBe('Jul');
    expect(dot.y).toBe(280);
  });

  it('matches the hover-dot stroke width and radius for visual parity', () => {
    const dot = buildTodayDot(1, 1);
    expect(dot.strokeWidth).toBe(1.5);
    expect(dot.r).toBe(4);
  });

  it('handles zero coordinates without coercion', () => {
    const dot = buildTodayDot(0, 0);
    expect(dot.x).toBe(0);
    expect(dot.y).toBe(0);
  });
});
