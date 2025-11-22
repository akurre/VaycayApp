// ============================================================================
// MAP CONSTANTS
// ============================================================================

import type { SunshineData } from './types/sunshineDataType';
import {
  IconCloudStorm,
  IconCloudFilled,
  IconCloudFog,
  IconSunElectricity,
  IconSunFilled,
  IconSunglasses,
  IconSnowman,
  IconSnowflake,
  IconTemperatureMinus,
  IconJacket,
  IconWind,
  IconMoodSmile,
  IconTemperatureSun,
  IconFlame,
  IconDropletOff,
  IconDroplet,
  IconDropletHalf2Filled,
  IconDropletFilled,
} from '@tabler/icons-react';

export const KM_TO_MILES = 0.621371;

export const MAX_CITIES_SHOWN = 300;

// LRU cache size for city-specific data
export const CITY_CACHE_MAX_SIZE = 30;

// locales that use miles instead of kilometers
export const MILES_LOCALES = ['en-US', 'en-GB', 'en-LR', 'en-MM'];

// zoom-based loading thresholds
export const ZOOM_THRESHOLD = 2; // switch to bounds query at zoom level 2+ (continental view)
export const DEBOUNCE_DELAY = 200; // ms - debounce delay for zoom/pan events (reduced for more responsive feel)
export const BOUNDS_BUFFER_PERCENT = 0.8; // add 80% buffer to calculated bounds to include edge countries
export const ZOOM_AMPLIFICATION_FACTOR = 3; // amplify zoom changes for more sensitive pinch/scroll zoom

// initial map view state
export const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
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

// home icon marker constants
export const HOME_ICON_SIZE = 32;

// pre-computed svg data url to avoid runtime encoding overhead
// minified svg for better performance
const HOME_ICON_SVG =
  '<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g transform="translate(24,24)"><path d="M-12,-8 L0,-16 L12,-8 L12,12 L-12,12 Z" fill="#FFD700" stroke="#000" stroke-width="1.5"/><rect x="-4" y="4" width="8" height="8" fill="#8B4513" stroke="#000" stroke-width="1"/><path d="M-12,-8 L0,-16 L12,-8" fill="none" stroke="#000" stroke-width="1.5"/></g></svg>';

export const HOME_ICON_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(HOME_ICON_SVG)}`;

// cached icon object to avoid recreating on every layer render
export const HOME_ICON_OBJECT = {
  url: HOME_ICON_DATA_URL,
  width: 48,
  height: 48,
  anchorY: 48,
} as const;

// ============================================================================
// TEMPERATURE & COLOR CONSTANTS
// ============================================================================

// fixed temperature thresholds (in celsius) and their corresponding colors
// the interpolation function in getMarkerColor.ts creates smooth gradients between these points
// so we only need key transition points, not every degree
export const TEMP_THRESHOLDS = [
  { temp: -20, color: [75, 0, 130] as [number, number, number] }, // deep purple (-20 or below)
  { temp: -10, color: [0, 0, 255] as [number, number, number] }, // blue (-20 to -10)
  { temp: 0, color: [135, 206, 250] as [number, number, number] }, // light blue (-10 to 0)
  { temp: 8, color: [64, 224, 208] as [number, number, number] }, // greenish blue (0 to 8)
  { temp: 13, color: [34, 139, 34] as [number, number, number] }, // green with a little yellow (8 to 13)
  { temp: 19, color: [255, 255, 0] as [number, number, number] }, // mostly yellow (13 to 19)
  { temp: 24, color: [255, 180, 0] as [number, number, number] }, // yellow-y orange (19 to 24)
  { temp: 29, color: [255, 100, 0] as [number, number, number] }, // orange (24 to 29)
  { temp: 34, color: [255, 69, 0] as [number, number, number] }, // orange-red (29 to 34)
  { temp: 45, color: [255, 0, 0] as [number, number, number] }, // red (34+)
];

// color range for heatmap layer (extracted from thresholds)
export const COLOR_RANGE: [number, number, number][] = TEMP_THRESHOLDS.map((t) => t.color);

// sunshine hours color thresholds for heatmap visualization
// ranges from low sunshine (dark/cool colors) to high sunshine (bright/warm colors)
export const SUNSHINE_THRESHOLDS = [
  { hours: 0, color: [100, 20, 150] as const }, // brighter purple (very low sunshine)
  { hours: 25, color: [70, 40, 190] as const }, // lighter purple-blue (very low sunshine)
  { hours: 50, color: [0, 120, 200] as const }, // bright blue (low sunshine)
  { hours: 80, color: [0, 180, 180] as const }, // cyan/turquoise (below average sunshine)
  { hours: 110, color: [60, 140, 40] as const }, // olive green (transitional sunshine)
  { hours: 140, color: [100, 200, 0] as const }, // lime green (average sunshine)
  { hours: 180, color: [173, 255, 47] as const }, // green-yellow (good sunshine)
  { hours: 220, color: [255, 255, 0] as const }, // yellow (very good sunshine)
  { hours: 260, color: [255, 165, 0] as const }, // orange (excellent sunshine)
  { hours: 300, color: [255, 69, 0] as const }, // orange-red (extreme sunshine)
  { hours: 340, color: [255, 20, 0] as const }, // bright red (near maximum sunshine)
  { hours: 380, color: [220, 0, 0] as const }, // deep red (maximum sunshine)
];

// extract color range from sunshine thresholds for heatmap layer
export const SUNSHINE_COLOR_RANGE = SUNSHINE_THRESHOLDS.map((t) => t.color);

// Default loading state colors
export const TEMPERATURE_LOADING_COLOR: [number, number, number, number] = [150, 150, 200, 255]; // Blue-gray
export const SUNSHINE_LOADING_COLOR: [number, number, number, number] = [150, 150, 150, 255]; // Gray

// Type for color cache entries
export type ColorCacheEntry = [number, number, number, number]; // r, g, b, a

// ============================================================================
// WEATHER ICON THRESHOLDS
// ============================================================================

// sunshine hours thresholds for icon selection
export const SUNSHINE_ICON_THRESHOLDS = [
  { hours: 0, icon: IconCloudStorm }, // very cloudy (0-45 hours)
  { hours: 45, icon: IconCloudFilled }, // pretty cloudy (45-70 hours)
  { hours: 70, icon: IconCloudFog }, // moderately cloudy (70-110 hours)
  { hours: 110, icon: IconSunElectricity }, // partly cloudy (110-180 hours)
  { hours: 180, icon: IconSunFilled }, // mostly sunny (180-260 hours)
  { hours: 240, icon: IconSunglasses }, // very sunny (240+ hours)
];

// temperature thresholds for icon selection
export const TEMPERATURE_ICON_THRESHOLDS = [
  { temp: -15, icon: IconSnowman }, // very cold (-15°C or below)
  { temp: -7, icon: IconSnowflake }, // a little below 0 (-7°C to 0°C)
  { temp: 0, icon: IconTemperatureMinus }, // cold above 0 (0°C to 8°C)
  { temp: 8, icon: IconJacket }, // chilly (8°C to 13°C)
  { temp: 13, icon: IconWind }, // in between (13°C to 20°C)
  { temp: 20, icon: IconMoodSmile }, // comfortably warm (20°C to 26°C)
  { temp: 26, icon: IconTemperatureSun }, // hot (26°C to 33°C)
  { temp: 33, icon: IconFlame }, // very hot (33°C+)
];

// precipitation thresholds for icon selection (in mm)
export const PRECIPITATION_ICON_THRESHOLDS = [
  { precip: 0, icon: IconDropletOff }, // no rain (0-20mm)
  { precip: 7, icon: IconDroplet }, // little rain (20-60mm)
  { precip: 15, icon: IconDropletHalf2Filled }, // moderate rain (60-120mm)
  { precip: 30, icon: IconDropletFilled }, // lots of rain (120mm+)
];

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
export const SUNSHINE_CHART_LINE_COLOR = '#f59e0b'; // orange/amber
export const SUNSHINE_CHART_GRID_COLOR = '#e5e7eb'; // light gray
export const SUNSHINE_CHART_AXIS_COLOR = '#9ca3af'; // medium gray
export const SUNSHINE_CHART_MAX_LINE_COLOR = '#3b82f6'; // blue for theoretical max
export const SUNSHINE_CHART_MIN_LINE_COLOR = '#6b7280'; // gray for baseline

// days in each month (using 28.25 for February to account for leap years)
export const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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
