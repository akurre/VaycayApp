export interface Bounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

// Float-precision guard for the cache-key string template — see
// test_quantization_string_stable. Math.round(n/step)*step can produce drift
// like 40.400000000000006; without this clamp the key string is unstable.
const FIXED_DECIMALS = 4;

/**
 * Quantize geographic bounds for use as a cache-key bucket. The step scales
 * with viewport size (span / 20, ~5% relative error at any zoom), so the
 * function preserves resolution at street-level zoom while collapsing
 * sub-degree pan jitter at continental zoom.
 *
 * Step IS NOT a flat constant. A flat 0.5° step would collapse genuinely
 * different street-level views (span < 0.5°) into the same key — see
 * test_deep_zoom_preserves_resolution. Do not "simplify" this to a constant.
 *
 * Output is intended ONLY for the cache-key string. Callers must continue to
 * pass the unquantized input bounds to SQL (BETWEEN minLat AND maxLat etc.)
 * so the actual data window is unaffected.
 */
export function quantizeBoundsForCacheKey(b: Bounds): Bounds {
  const span = Math.max(b.maxLat - b.minLat, b.maxLong - b.minLong);
  if (span <= 0) return b;
  const step = span / 20;
  const q = (n: number) => Number((Math.round(n / step) * step).toFixed(FIXED_DECIMALS));
  return {
    minLat: q(b.minLat),
    maxLat: q(b.maxLat),
    minLong: q(b.minLong),
    maxLong: q(b.maxLong),
  };
}
