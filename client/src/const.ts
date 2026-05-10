// ============================================================================
// MAP CONSTANTS
// ============================================================================

import {
  AMBER_BRAND_SHADE,
  primaryAmberShades,
  secondaryOceanShades,
} from '@/theme';
import type { SunshineData } from '@/types/sunshineDataType';
import { DataType } from '@/types/mapTypes';

export const KM_TO_MILES = 0.621371;

export const MAX_CITIES_SHOWN = 300;

// LRU cache size for city-specific data
export const CITY_CACHE_MAX_SIZE = 30;

// zoom-based loading thresholds
export const ZOOM_THRESHOLD = 2; // switch to bounds query at zoom level 2+ (continental view)
export const DEBOUNCE_DELAY = 300; // ms — bounds-query debounce: how long the viewport must be idle before we fire a new bounds query

// Holds isGesturing true after the last viewState change. Longer than
// DEBOUNCE_DELAY so a quick follow-up pan isn't blocked by the post-load transition.
export const GESTURE_GRACE_MS = 800;
export const BOUNDS_BUFFER_PERCENT = 0.3; // add 30% buffer to viewport bounds to pre-fetch dots before they're visible

// deck.gl scrollZoom speed. 3× default (0.01) for responsiveness without
// the overshoot the previous 15× value caused.
export const MAP_SCROLL_ZOOM_SPEED = 0.03;

// Cap deck.gl drawing-buffer ratio. Full devicePixelRatio on 2×/3× displays
// rasterises 4×/9× more fragments per frame for an imperceptible visual gain.
export const MAP_MAX_DEVICE_PIXEL_RATIO = 1.5;

// Marker fade-in durations (ms). Long transitions on 300 markers stalled
// gestures started during the layer rebuild; 80 ms still reads intentional.
export const MARKER_COLOR_TRANSITION_MS = 80;
export const MARKER_OPACITY_TRANSITION_MS = 80;
export const MARKER_RADIUS_TRANSITION_MS = 80;

// Mantine Transition duration (ms) for the small map data-loading spinner.
export const MAP_DATA_LOADER_FADE_MS = 150;

// initial map view state
export const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.9,
  pitch: 0,
  bearing: 0,
};

export const TOGGLE_ICON_SIZE = 16;

// ============================================================================
// TOP COMMAND BAR / HOVER POPOVER CONSTANTS
// ============================================================================

// Delay before a hover-popover closes after the cursor leaves both trigger
// and content. Long enough to forgive a quick mouse-out, short enough to feel
// snappy. Mutual-exclusion (opening another popover) bypasses this delay.
export const POPOVER_CLOSE_DELAY_MS = 300;

// Vertical gap between the anchor's bottom edge and the popover's top edge.
export const POPOVER_OFFSET_Y = 8;

// Fixed widths for the two popovers in the top command bar.
export const HOME_POPOVER_WIDTH_PX = 320;
export const DATE_POPOVER_WIDTH_PX = 720;

// Date popover slide-in animation: duration of the fade/slide and the
// off-screen vertical offset (px) when hidden.
export const DATE_POPOVER_TRANSITION_MS = 250;
export const DATE_POPOVER_HIDDEN_OFFSET_PX = -10;

// Minimum characters typed before kicking off a city-search request.
// Used by the search hook and any UI that gates "no results" messaging on
// whether a real query has been issued.
export const MIN_CITY_SEARCH_LENGTH = 2;

// Debounce window for the city-search TextInput. Long enough to skip
// mid-word typing churn, short enough to feel responsive.
export const CITY_SEARCH_DEBOUNCE_MS = 300;

// max persisted cities for the "Suggested" list in compare-city UIs
export const RECENT_CITIES_MAX = 5;

// Divisor used to render city population as "X.XM" in compare/search rows.
export const POPULATION_MILLION_DIVISOR = 1_000_000;

// map style urls for light and dark themes
// Carto basemaps - using direct CDN URLs (no proxy needed, CORS-enabled)
export const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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
export const HOME_DEFAULT_MARKER_COLOR: [number, number, number, number] = [
  255, 255, 255, 255,
];

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
// the interpolation function in getMarkerColor.ts creates smooth gradients between these points
// so we only need key transition points, not every degree
export const TEMP_THRESHOLDS = [
  { temp: -25, color: [100, 20, 150] as [number, number, number] }, // purple (-25 or below)
  { temp: -15, color: [50, 60, 190] as [number, number, number] }, // deep blue (-25 to -15)
  { temp: -9, color: [0, 120, 220] as [number, number, number] }, // bright blue (-15 to -9)
  { temp: -3, color: [0, 190, 190] as [number, number, number] }, // cyan (-9 to -3)
  { temp: 3, color: [0, 180, 120] as [number, number, number] }, // seafoam (-3 to 3)
  { temp: 9, color: [40, 180, 60] as [number, number, number] }, // emerald green (3 to 9)
  { temp: 15, color: [160, 215, 0] as [number, number, number] }, // lime green (9 to 15)
  { temp: 21, color: [235, 255, 0] as [number, number, number] }, // yellow (15 to 21)
  { temp: 27, color: [255, 200, 0] as [number, number, number] }, // amber (21 to 27)
  { temp: 33, color: [255, 120, 0] as [number, number, number] }, // orange (27 to 33)
  { temp: 39, color: [230, 60, 0] as [number, number, number] }, // red-orange (33 to 39)
  { temp: 45, color: [220, 0, 40] as [number, number, number] }, // deep red (39+)
];

// color range for heatmap layer (extracted from thresholds)
export const COLOR_RANGE: [number, number, number][] = TEMP_THRESHOLDS.map(
  (t) => t.color
);

// Sunshine percent color thresholds for heatmap + marker visualization. We use
// percent-of-theoretical-max (actual hours / astronomical max for that
// lat+month) so high-latitude cities aren't unfairly favored in summer just
// for having more daylight. Extremes (0-20% very cloudy, 90%+ desert) get
// wider single buckets; the 40-70% prime range where most cities cluster gets
// finer 5-10% buckets for visual contrast.
export const SUNSHINE_THRESHOLDS = [
  { percent: 0, color: [100, 20, 150] as const }, // Purple
  { percent: 8, color: [50, 60, 190] as const }, // Deep Blue
  { percent: 16, color: [0, 120, 220] as const }, // Bright Blue
  { percent: 24, color: [0, 190, 190] as const }, // Cyan
  { percent: 32, color: [0, 180, 120] as const }, // Seafoam/Teal
  { percent: 40, color: [40, 180, 60] as const }, // Emerald Green
  { percent: 48, color: [160, 215, 0] as const }, // Lime Green
  { percent: 56, color: [235, 255, 0] as const }, // Yellow
  { percent: 64, color: [255, 200, 0] as const }, // Amber
  { percent: 72, color: [255, 120, 0] as const }, // Orange
  { percent: 80, color: [230, 60, 0] as const }, // Red-Orange
  { percent: 88, color: [220, 0, 40] as const }, // Deep Red
];

// extract color range from sunshine thresholds for heatmap layer
export const SUNSHINE_COLOR_RANGE = SUNSHINE_THRESHOLDS.map((t) => t.color);

// Default loading state colors
export const TEMPERATURE_LOADING_COLOR: [number, number, number, number] = [
  150, 150, 200, 255,
]; // Blue-gray
export const SUNSHINE_LOADING_COLOR: [number, number, number, number] = [
  150, 150, 150, 255,
]; // Gray

// Type for color cache entries
export type ColorCacheEntry = [number, number, number, number]; // r, g, b, a

// Light-mode dot stroke — ocean shade 6 (#1F4E66) at ~20% alpha. Adds a subtle
// outline so cool-blue dots don't disappear into the cream basemap.
export const DOT_STROKE_LIGHT: [number, number, number, number] = [
  31, 78, 102, 51,
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
export const SLIDER_THUMB_WIDTH = 14;

// Tick mark dimensions rendered by SliderMarks beneath each mark value.
export const SLIDER_MARK_TICK_WIDTH_PX = 1;
export const SLIDER_MARK_TICK_HEIGHT_PX = 6;

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

// Mobile date scrubber marks: tick for every month, text label only at the
// quarter midpoints (Feb/May/Aug/Nov) — empty `label` renders a small tick.
export const monthMarksMobile = [
  { value: 1, label: '' },
  { value: 32, label: 'Feb' },
  { value: 60, label: '' },
  { value: 91, label: '' },
  { value: 121, label: 'May' },
  { value: 152, label: '' },
  { value: 182, label: '' },
  { value: 213, label: 'Aug' },
  { value: 244, label: '' },
  { value: 274, label: '' },
  { value: 305, label: 'Nov' },
  { value: 335, label: '' },
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

// Mobile monthly marks: tick for every month, text label only at the quarter
// midpoints (Feb/May/Aug/Nov) — empty `label` renders a small tick.
export const monthlyMarksMobile = [
  { value: 1, label: '' },
  { value: 2, label: 'Feb' },
  { value: 3, label: '' },
  { value: 4, label: '' },
  { value: 5, label: 'May' },
  { value: 6, label: '' },
  { value: 7, label: '' },
  { value: 8, label: 'Aug' },
  { value: 9, label: '' },
  { value: 10, label: '' },
  { value: 11, label: 'Nov' },
  { value: 12, label: '' },
];

// ============================================================================
// CITY POPUP RIBBON CONSTANTS
// ============================================================================

// Fixed width of the right-side stat-card rail in the CityPopup ribbon. Used
// in both width and flex-basis calculations, so it lives as a named constant.
export const RIBBON_STAT_RAIL_WIDTH_PX = 158;

// Right-side padding budget reserved in the ribbon header row for the popup's
// absolute-positioned close button.
export const RIBBON_HEADER_RIGHT_RESERVE_PX = 40;

// Em-dash placeholder shown in stat cells / readouts when a value is missing.
export const EM_DASH_PLACEHOLDER = '—';

// Day-of-year of the first of each month (non-leap year). Index 0 = Jan 1.
export const MONTH_DAY_OF_YEAR_STARTS = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];

// Total days in a non-leap year. Used as the x-axis denominator for the
// month-label rail so labels align with day-of-year positions.
export const DAYS_IN_YEAR_NON_LEAP = 365;

// Three-letter month abbreviations without trailing punctuation. Distinct
// from MONTH_ABBREVIATIONS, which carries periods (e.g. "Jan.").
export const MONTH_ABBREVIATIONS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Wait one tick before focusing the comparison-city input — Popover mounts the
// target lazily and the focus would otherwise race the mount.
export const COMPARISON_INPUT_FOCUS_DELAY_MS = 10;

// Max characters to keep verbatim in the ribbon's state segment before
// truncating with a trailing period (e.g. "California" → "Californ.").
export const STATE_ABBREVIATION_MAX_LENGTH = 8;

// Day-of-month used as the default when only a month is known (e.g. sunshine
// rows have no specific date). 15 lands roughly on the climatological mean.
export const MONTH_MIDPOINT_DAY = 15;

// Today-readout label prefix per active tab. Fixed map of UI strings keyed by
// the active DataType so the readout component stays declarative.
export const TODAY_READOUT_PREFIX_BY_TAB: Record<DataType, string> = {
  [DataType.Temperature]: 'On this day',
  [DataType.Sunshine]: 'In this month',
  [DataType.Precip]: 'In this week',
};

// Optional secondary descriptor appended to the today-readout label for tabs
// that need extra context (e.g. sunshine renders "% sun" + "daylight" hint).
export const TODAY_READOUT_VALUE_LABEL: Partial<Record<DataType, string>> = {
  [DataType.Sunshine]: 'daylight',
};

// ============================================================================
// GRAPH COLOR CONSTANTS
// ============================================================================

// Each city plots avg/max/min temp lines on the same chart. We pick three
// shades from the brand palette: lighter = max temp, deeper = min temp.
// City 1 (main / warmest destination) — Amber family
export const CITY1_PRIMARY_COLOR = primaryAmberShades[AMBER_BRAND_SHADE];

// City 2 (comparison / home) — Ocean family, recedes visually
export const CITY2_PRIMARY_COLOR = secondaryOceanShades[3]; // #6E9DB6
export const CITY2_BADGE_BACKGROUND = `${CITY2_PRIMARY_COLOR}26`; // 15% opacity (0x26 = 38 ≈ 0.15 * 255)

// Today-marker shades — distinctly deeper than the hover/primary swatch so
// today dots stay readable when comparison is active without doubling up
// the brand color.
export const CITY1_TODAY_COLOR = primaryAmberShades[AMBER_BRAND_SHADE + 1]; // #C97A24
export const CITY2_TODAY_COLOR = secondaryOceanShades[5]; // #2E627F

// ============================================================================
// WORLD MAP BIG LOADER CONSTANTS
// ============================================================================
// Constants for World Map loading state transition timing
export const LOADER_DELAY_MS = 300;
export const MAP_FADE_IN_DELAY_MS = 100;
export const MAP_LOADING_OPACITY = 0.3;
export const MAP_LOADED_OPACITY = 1;
export const TIER2_ESCALATION_MS = 3000;
export const BREATHE_MIN_OPACITY = 0.5;
export const BREATHE_MAX_OPACITY = 0.8;
export const BREATHE_CYCLE_MS = 1200;

// Ghost dot constants for Tier 2 loading placeholders
export const GHOST_DOT_OPACITY = 0.15; // Layer-level opacity for DeckGL
export const GHOST_DOT_ALPHA = 40; // Per-vertex color alpha channel (0-255)
export const GHOST_DOT_MAX_COUNT = 50;
export const GHOST_DOT_GRID_SPACING_DEG = 2;
export const GHOST_DOT_EXCLUSION_RADIUS_DEG = 1;

// ============================================================================
// MOBILE LAYOUT CONSTANTS
// ============================================================================
// Below this width OR on a mobile UA, render mobile chrome (slim bar, bottom scrubber, drawer).
// 932 = iPhone 16 Pro Max landscape; small laptops also trigger mobile chrome — deliberate, not degraded.
export const MOBILE_BREAKPOINT_PX = 932;

// UA regex for detecting mobile devices. Matches phones, tablets, and the
// in-app browsers shipped with most mobile OSes (CriOS = Chrome on iOS).
export const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

// Top bar geometry — used by MobileTopCommandBar and HamburgerSheet.
export const MOBILE_TOP_BAR_TOP_PX = 16;
export const MOBILE_BAR_INSET_PX = 12;
export const MOBILE_BAR_HEIGHT_PX = 52;
export const MOBILE_BAR_RADIUS_PX = 16;
export const MOBILE_HAMBURGER_WIDTH_PX = 320;
export const MOBILE_ICON_BUTTON_SIZE_PX = 36;

// Top offset for chrome that sits just below the mobile top bar (legend, loader).
// = MOBILE_TOP_BAR_TOP_PX (16) + MOBILE_BAR_HEIGHT_PX (52) + 12px gap.
export const MOBILE_BELOW_BAR_TOP_PX = 80;

// Persistent mobile date scrubber: distance from viewport bottom.
export const MOBILE_SCRUBBER_BOTTOM_PX = 16;

// Desktop top offset for floating chrome elements (legend, loader).
export const DESKTOP_TOP_OFFSET_PX = 16;

// Mobile city drawer geometry.
export const MOBILE_DRAWER_HEIGHT_CAP_PX = 380;
export const MOBILE_DRAWER_HEIGHT_VH = 45;
export const MOBILE_DRAWER_HEADER_PX = 52;
export const MOBILE_DRAWER_CHART_MIN_PX = 180;
export const MOBILE_DRAWER_TAB_BAR_PX = 44;
export const MOBILE_DRAWER_BOTTOM_PAD_PX = 12;
export const MOBILE_DRAWER_DRAG_HANDLE_W_PX = 36;
export const MOBILE_DRAWER_DRAG_HANDLE_H_PX = 4;
export const MOBILE_DRAWER_RADIUS_PX = 28;
export const MOBILE_DRAWER_DISMISS_DRAG_FRACTION = 0.4;
export const MOBILE_DRAWER_DISMISS_VELOCITY_PX_PER_S = 500;
// Velocity-based dismissal is ignored if the drag duration is shorter than
// this; real flicks span multiple frames, sub-frame deltas are noise.
export const MOBILE_DRAWER_DISMISS_VELOCITY_MIN_DT_MS = 80;
export const MOBILE_DRAWER_DISMISS_ANIM_MS = 200;
export const MS_PER_SECOND = 1000;
