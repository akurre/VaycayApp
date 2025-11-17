import { PRECIPITATION_ICON_THRESHOLDS } from '@/constants';
import { IconDroplet } from '@tabler/icons-react';
import { ComponentType } from 'react';

/**
 * returns the appropriate icon component based on precipitation amount
 * uses the PRECIPITATION_ICON_THRESHOLDS to determine which icon to display
 */
export const getPrecipitationIcon = (precip: number | null): ComponentType<{ size?: number; color?: string; stroke?: number }> => {
  // if no data, return default icon
  if (precip === null) {
    return IconDroplet;
  }

  // find the appropriate threshold
  for (let i = PRECIPITATION_ICON_THRESHOLDS.length - 1; i >= 0; i--) {
    if (precip >= PRECIPITATION_ICON_THRESHOLDS[i].precip) {
      return PRECIPITATION_ICON_THRESHOLDS[i].icon;
    }
  }

  // fallback to first threshold icon (should never happen)
  return PRECIPITATION_ICON_THRESHOLDS[0].icon;
};

export default getPrecipitationIcon;
