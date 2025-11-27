// ============================================================================
// MAP CONSTANTS
// ============================================================================

import type { SunshineData } from './types/sunshineDataType';

export const KM_TO_MILES = 0.621371;

export const MAX_CITIES_SHOWN = 300;

// LRU cache size for city-specific data
export const CITY_CACHE_MAX_SIZE = 30;

// locales that use miles instead of kilometers
export const MILES_LOCALES = ['en-US', 'en-GB', 'en-LR', 'en-MM'];

// zoom-based loading thresholds
export const ZOOM_THRESHOLD = 2; // switch to bounds query at zoom level 2+ (continental view)
export const DEBOUNCE_DELAY = 200; // ms - debounce delay for zoom/pan events (reduced for more responsive feel)
export const BOUNDS_BUFFER_PERCENT = 0.5; // add 50% buffer to viewport bounds to include nearby cities outside visible area
export const ZOOM_AMPLIFICATION_FACTOR = 3; // amplify zoom changes for more sensitive pinch/scroll zoom

// initial map view state
export const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.9,
  pitch: 0,
  bearing: 0,
};

export const TOGGLE_ICON_SIZE = 16;

// map style urls for light and dark themes
// using carto basemaps via vite proxy to bypass cors restrictions
export const MAP_STYLES = {
  light: '/basemaps/gl/positron-gl-style/style.json',
  dark: '/basemaps/gl/dark-matter-gl-style/style.json',
} as const;

// ============================================================================
// HOME LOCATION MARKER CONSTANTS
// ============================================================================

/**
 * Duration of one complete pulse cycle in milliseconds
 * Increase for slower animation, decrease for faster
 */
export const HOME_PULSE_DURATION = 2000;

/**
 * Ring radius range (in pixels)
 * The ring will pulse between MIN and MAX values
 */
export const HOME_RING_RADIUS_MIN = 4;
export const HOME_RING_RADIUS_MAX = 12;

/**
 * Ring opacity range (0-255)
 * The ring will pulse between MIN and MAX opacity
 */
export const HOME_RING_OPACITY_MIN = 255;
export const HOME_RING_OPACITY_MAX = 0;

/**
 * Ring color in RGB
 * Default: Gold [255, 215, 0]
 */
export const HOME_RING_COLOR: [number, number, number] = [255, 215, 0];

/**
 * Center dot radius range (in pixels)
 */
export const HOME_CENTER_RADIUS_MIN = 5;
export const HOME_CENTER_RADIUS_MAX = 8;

/**
 * Default marker color when no data is available (RGBA)
 * Default: White
 */
export const HOME_DEFAULT_MARKER_COLOR: [number, number, number, number] = [255, 255, 255, 255];

/**
 * Base radius for all home location layers in map units
 */
export const HOME_LOCATION_BASE_RADIUS = 50000;

/**
 * Ring stroke width in pixels
 */
export const HOME_RING_STROKE_WIDTH = 2;

// ============================================================================
// TEMPERATURE & COLOR CONSTANTS
// ============================================================================

// fixed temperature thresholds (in celsius) and their corresponding colors
// using a sequential blue-to-red color scheme for cleaner heatmap visualization
// this prevents the "rainbow edge" effect that occurs with diverging color palettes
export const TEMP_THRESHOLDS = [
  { temp: -20, color: [8, 48, 107] as [number, number, number] }, // dark blue (very cold)
  { temp: -10, color: [33, 102, 172] as [number, number, number] }, // blue (cold)
  { temp: 0, color: [67, 147, 195] as [number, number, number] }, // light blue (freezing)
  { temp: 10, color: [146, 197, 222] as [number, number, number] }, // pale blue (cool)
  { temp: 18, color: [209, 229, 240] as [number, number, number] }, // very pale blue (mild)
  { temp: 22, color: [253, 219, 199] as [number, number, number] }, // pale orange (comfortable)
  { temp: 26, color: [244, 165, 130] as [number, number, number] }, // light orange (warm)
  { temp: 30, color: [214, 96, 77] as [number, number, number] }, // orange-red (hot)
  { temp: 35, color: [178, 24, 43] as [number, number, number] }, // red (very hot)
  { temp: 45, color: [103, 0, 31] as [number, number, number] }, // dark red (extreme heat)
];

// color range for heatmap layer (extracted from thresholds)
export const COLOR_RANGE: [number, number, number][] = TEMP_THRESHOLDS.map((t) => t.color);

// sunshine hours color thresholds for heatmap visualization
// using a sequential yellow-to-orange color scheme for cleaner visualization
// this prevents the "rainbow edge" effect that occurs with diverging color palettes
export const SUNSHINE_THRESHOLDS = [
  { hours: 0, color: [255, 255, 217] as const }, // very pale yellow (very low sunshine)
  { hours: 50, color: [255, 247, 188] as const }, // pale yellow (low sunshine)
  { hours: 100, color: [254, 227, 145] as const }, // light yellow (below average)
  { hours: 150, color: [254, 196, 79] as const }, // yellow (average sunshine)
  { hours: 200, color: [254, 153, 41] as const }, // golden yellow (good sunshine)
  { hours: 250, color: [236, 112, 20] as const }, // orange (very good sunshine)
  { hours: 300, color: [204, 76, 2] as const }, // dark orange (excellent sunshine)
  { hours: 350, color: [153, 52, 4] as const }, // brown-orange (extreme sunshine)
  { hours: 380, color: [102, 37, 6] as const }, // dark brown (maximum sunshine)
];

// extract color range from sunshine thresholds for heatmap layer
export const SUNSHINE_COLOR_RANGE = SUNSHINE_THRESHOLDS.map((t) => t.color);

// Default loading state colors
export const TEMPERATURE_LOADING_COLOR: [number, number, number, number] = [150, 150, 200, 255]; // Blue-gray
export const SUNSHINE_LOADING_COLOR: [number, number, number, number] = [150, 150, 150, 255]; // Gray

// Type for color cache entries
export type ColorCacheEntry = [number, number, number, number]; // r, g, b, a

// ============================================================================
// ERROR NOTIFICATION CONSTANTS
// ============================================================================

// notification auto-close durations (in milliseconds)
export const ERROR_NOTIFICATION_DURATION = 5000;
export const WARNING_NOTIFICATION_DURATION = 3000;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_ABBREVIATIONS: Record<string, string> = {
  '01': 'Jan.',
  '02': 'Feb.',
  '03': 'Mar.',
  '04': 'Apr.',
  '05': 'May',
  '06': 'Jun.',
  '07': 'Jul.',
  '08': 'Aug.',
  '09': 'Sep.',
  '10': 'Oct.',
  '11': 'Nov.',
  '12': 'Dec.',
};

export const MONTH_FIELDS: Record<number, keyof SunshineData> = {
  1: 'jan',
  2: 'feb',
  3: 'mar',
  4: 'apr',
  5: 'may',
  6: 'jun',
  7: 'jul',
  8: 'aug',
  9: 'sep',
  10: 'oct',
  11: 'nov',
  12: 'dec',
};

// custom date slider thumb dimensions for positioning calculations
export const SLIDER_THUMB_WIDTH = 32; // 8 * 4 (w-8 in tailwind)

// sunshine graph chart colors
export const SUNSHINE_CHART_LINE_COLOR = '#20A39E'; // secondary teal
export const SUNSHINE_CHART_GRID_COLOR = '#e5e7eb'; // light gray
export const SUNSHINE_CHART_AXIS_COLOR = '#9ca3af'; // medium gray
export const SUNSHINE_CHART_MAX_LINE_COLOR = '#E63E55'; // theme red for theoretical max
export const SUNSHINE_CHART_MIN_LINE_COLOR = '#6b7280'; // gray for baseline

// days in each month (using 28.25 for February to account for leap years)
export const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// calendar days in each month (non-leap year) - for iteration
export const CALENDAR_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// standard month length for normalizing sunshine calculations (365.25 / 12)
export const STANDARD_MONTH_LENGTH = 30.4375;

// month boundaries for labels (day-of-year format)
export const monthMarks = [
  { value: 1, label: 'Jan' },
  { value: 32, label: 'Feb' },
  { value: 60, label: 'Mar' },
  { value: 91, label: 'Apr' },
  { value: 121, label: 'May' },
  { value: 152, label: 'Jun' },
  { value: 182, label: 'Jul' },
  { value: 213, label: 'Aug' },
  { value: 244, label: 'Sep' },
  { value: 274, label: 'Oct' },
  { value: 305, label: 'Nov' },
  { value: 335, label: 'Dec' },
];

// monthly marks for date slider when in monthly mode (sunshine data)
export const monthlyMarks = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
] as const;

// ============================================================================
// GRAPH COLOR CONSTANTS
// ============================================================================

// City 1 (main city) colors - Blue shades
export const CITY1_PRIMARY_COLOR = '#3b82f6'; // medium blue
export const CITY1_MAX_COLOR = '#93c5fd'; // light blue
export const CITY1_MIN_COLOR = '#1e40af'; // dark blue

// City 2 (comparison city) colors - Purple shades
export const CITY2_PRIMARY_COLOR = '#a855f7'; // medium purple
export const CITY2_MAX_COLOR = '#d8b4fe'; // light purple
export const CITY2_MIN_COLOR = '#7e22ce'; // dark purple
