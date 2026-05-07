import { BOUNDS_QUANTIZATION_STEP_DENOMINATOR } from '../const';
import type { Bounds } from '../types/boundsTypes';

// Float-precision guard for the cache-key string template — see the
// "string-stable cache key" test. Math.round(n/step)*step can produce drift
// like 40.400000000000006; without this clamp the key string is unstable.
const FIXED_DECIMALS = 4;

/**
 * Quantize geographic bounds for use as a cache-key bucket. The step scales
 * with viewport size (span / N, ~5% relative error at any zoom), so the
 * function preserves resolution at street-level zoom while collapsing
 * sub-degree pan jitter at continental zoom.
 *
 * Step IS NOT a flat constant. A flat 0.5° step would collapse genuinely
 * different street-level views (span < 0.5°) into the same key — see the
 * "preserves resolution at deep zoom" regression-guard test. Do not
 * "simplify" this to a constant.
 *
 * Output is intended ONLY for the cache-key string. Callers must continue to
 * pass the unquantized input bounds to SQL (BETWEEN minLat AND maxLat etc.)
 * so the actual data window is unaffected.
 */
export default function quantizeBoundsForCacheKey(b: Bounds): Bounds {
  const span = Math.max(b.maxLat - b.minLat, b.maxLong - b.minLong);
  if (span <= 0) return b;
  const step = span / BOUNDS_QUANTIZATION_STEP_DENOMINATOR;
  const q = (n: number) => Number((Math.round(n / step) * step).toFixed(FIXED_DECIMALS));
  return {
    minLat: q(b.minLat),
    maxLat: q(b.maxLat),
    minLong: q(b.minLong),
    maxLong: q(b.maxLong),
  };
}
