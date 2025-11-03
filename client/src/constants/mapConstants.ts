// zoom-based loading thresholds
export const ZOOM_THRESHOLD = 5; // switch to bounds query at zoom level 5+ (was 4, increased to show more context)
export const DEBOUNCE_DELAY = 300; // ms - debounce delay for zoom/pan events
export const BOUNDS_BUFFER_PERCENT = 0.3; // add 30% buffer to calculated bounds to include nearby areas
