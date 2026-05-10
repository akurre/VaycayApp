import { MonthlySunshine } from '@prisma/client';

// global map display configuration
export const MAX_CITIES_GLOBAL_VIEW = 300;

// caching configuration
export const CACHE_CONFIG = {
  // cache TTL in seconds (1 hour)
  TTL: 3600,

  // check for expired entries every 10 minutes
  CHECK_PERIOD: 600,
};

// step denominator for cache-key bounds quantization. step = span / N gives
// ~5% relative error per edge at any zoom while preserving street-level
// resolution. Do not flatten to a constant degree value — see the
// "preserves resolution at deep zoom" test in quantizeBoundsForCacheKey.test.ts.
export const BOUNDS_QUANTIZATION_STEP_DENOMINATOR = 20;

// ordered list of monthly field names used for dynamic column selection
export const MONTH_FIELDS: Array<keyof MonthlySunshine> = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];
