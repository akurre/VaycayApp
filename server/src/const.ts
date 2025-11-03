// global map display configuration
export const MAX_CITIES_GLOBAL_VIEW = 300;

// adaptive quota thresholds for fair city distribution
export const QUOTA_THRESHOLDS = {
  // when countries > 30: strict limit (many countries visible)
  MANY_COUNTRIES: 30,
  MAX_PER_COUNTRY_MANY: 6, // 1 guaranteed + 5 additional

  // when countries 15-30: moderate limit
  MODERATE_COUNTRIES: 15,
  MAX_PER_COUNTRY_MODERATE: 11, // 1 guaranteed + 10 additional

  // when countries < 15: generous limit (few countries visible)
  MAX_PER_COUNTRY_FEW: 21, // 1 guaranteed + 20 additional
};

// caching configuration
export const CACHE_CONFIG = {
  // cache TTL in seconds (1 hour)
  TTL: 3600,

  // check for expired entries every 10 minutes
  CHECK_PERIOD: 600,
};

// zoom-based loading thresholds (for future Phase 2)
export const ZOOM_THRESHOLDS = {
  // use global query (no bounds) for zoom levels 1-3
  GLOBAL_VIEW_MAX_ZOOM: 3,

  // use bounds query for zoom levels 4+
  BOUNDS_VIEW_MIN_ZOOM: 4,

  // minimum bounds change to trigger new query (degrees)
  MIN_BOUNDS_CHANGE: 5,

  // debounce delay for zoom/pan events (ms)
  DEBOUNCE_DELAY: 300,
};
