import { describe, test, expect } from 'vitest';
import quantizeBoundsForCacheKey from '../../utils/quantizeBoundsForCacheKey';

describe('quantizeBoundsForCacheKey', () => {
  test('should round bounds to span/20 step at continental zoom', () => {
    // span = max(19.6, 40) = 40 → step = 40/20 = 2°. Bounds round to nearest 2°.
    const result = quantizeBoundsForCacheKey({
      minLat: 40.7,
      maxLat: 60.3,
      minLong: 0.5,
      maxLong: 40.5,
    });
    expect(result).toEqual({ minLat: 40, maxLat: 60, minLong: 0, maxLong: 40 });
  });

  test('should quantize proportionally at city zoom', () => {
    // span = max(5, 4.98) = 5 → step = 5/20 = 0.25°. Bounds round to nearest 0.25°.
    const result = quantizeBoundsForCacheKey({
      minLat: 40.13,
      maxLat: 45.13,
      minLong: 0.04,
      maxLong: 5.02,
    });
    expect(result).toEqual({ minLat: 40.25, maxLat: 45.25, minLong: 0, maxLong: 5 });
  });

  test('should produce the same key for two close continental viewports in the same bucket', () => {
    // span = max(10, 20) = 20 → step = 1°. Shifts under 0.5° collapse to same bin.
    const a = quantizeBoundsForCacheKey({
      minLat: 40.0,
      maxLat: 50.0,
      minLong: 0.0,
      maxLong: 20.0,
    });
    const b = quantizeBoundsForCacheKey({
      minLat: 40.4,
      maxLat: 50.4,
      minLong: 0.4,
      maxLong: 20.4,
    });
    expect(a).toEqual(b);
  });

  test('should preserve resolution at deep zoom (regression guard)', () => {
    // REGRESSION GUARD against any future "simplify to flat constant" refactor.
    // Street-level: span = 0.01 → step = 0.0005. Two views 0.05° apart MUST NOT
    // collapse to the same key. A flat 0.5° quantization would erase this.
    const a = quantizeBoundsForCacheKey({
      minLat: 52.5,
      maxLat: 52.51,
      minLong: 13.4,
      maxLong: 13.41,
    });
    const b = quantizeBoundsForCacheKey({
      minLat: 52.55,
      maxLat: 52.56,
      minLong: 13.45,
      maxLong: 13.46,
    });
    expect(a).not.toEqual(b);
  });

  test('should pass through degenerate zero-span bounds without dividing by zero', () => {
    // maxLat === minLat AND maxLong === minLong → span is 0; don't divide by 0.
    const input = { minLat: 40, maxLat: 40, minLong: 10, maxLong: 10 };
    const result = quantizeBoundsForCacheKey(input);
    expect(result).toEqual(input);
  });

  test('should produce a string-stable cache key (no scientific notation, ≤4 decimals)', () => {
    // FLOAT-PRECISION GUARD. Math.round(n/step)*step can produce drift like
    // 40.400000000000006 for some inputs. The internal toFixed(4) clamp must
    // keep the cache-key string free of scientific notation and >4-decimal drift.
    // Inputs chosen to trigger the drift case (span=1 → step=0.05).
    const result = quantizeBoundsForCacheKey({
      minLat: 40.4,
      maxLat: 41.4,
      minLong: 0.0,
      maxLong: 1.0,
    });
    const key = `weather:2020-03-15:bounds:${result.minLat}-${result.maxLat}:${result.minLong}-${result.maxLong}`;
    expect(key).not.toMatch(/e[+-]/i);
    expect(key).not.toMatch(/\.\d{5,}/);
  });
});
