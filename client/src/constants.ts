// ============================================================================
// MAP CONSTANTS
// ============================================================================

export const KM_TO_MILES = 0.621371;

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
export const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

// home icon marker constants
export const HOME_ICON_SIZE = 32;

// pre-computed svg data url to avoid runtime encoding overhead
// minified svg for better performance
const HOME_ICON_SVG = '<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g transform="translate(24,24)"><path d="M-12,-8 L0,-16 L12,-8 L12,12 L-12,12 Z" fill="#FFD700" stroke="#000" stroke-width="1.5"/><rect x="-4" y="4" width="8" height="8" fill="#8B4513" stroke="#000" stroke-width="1"/><path d="M-12,-8 L0,-16 L12,-8" fill="none" stroke="#000" stroke-width="1.5"/></g></svg>';

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

// ============================================================================
// ERROR NOTIFICATION CONSTANTS
// ============================================================================

// notification auto-close durations (in milliseconds)
export const ERROR_NOTIFICATION_DURATION = 5000;
export const WARNING_NOTIFICATION_DURATION = 3000;

// ============================================================================
// UI CONSTANTS
// ============================================================================

// custom date slider thumb dimensions for positioning calculations
export const SLIDER_THUMB_WIDTH = 32; // 8 * 4 (w-8 in tailwind)

// month boundaries for labels
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



