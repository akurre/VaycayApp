// ============================================================================
// MAP CONSTANTS
// ============================================================================

// zoom-based loading thresholds
export const ZOOM_THRESHOLD = 2; // switch to bounds query at zoom level 2+ (continental view)
export const DEBOUNCE_DELAY = 300; // ms - debounce delay for zoom/pan events
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
// UI CONSTANTS
// ============================================================================

// custom date slider thumb dimensions for positioning calculations
export const SLIDER_THUMB_WIDTH = 32; // 8 * 4 (w-8 in tailwind)
