import { MonthlySunshine } from '@prisma/client';

// global map display configuration
export const MAX_CITIES_GLOBAL_VIEW = 300;

// area-based distribution configuration
// cities are distributed proportionally by geographic area
// large countries get more cities, small countries get minimum representation
export const AREA_DISTRIBUTION = {
  // minimum cities per country (ensures all countries are represented)
  MIN_CITIES_PER_COUNTRY: 1,
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
  DEBOUNCE_DELAY: 150,
};

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
