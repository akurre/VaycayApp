import { TEMPERATURE_ICON_THRESHOLDS } from '@/constants';
import { IconTemperatureSun } from '@tabler/icons-react';
import { ComponentType } from 'react';

/**
 * returns the appropriate icon component based on temperature
 * uses the TEMPERATURE_ICON_THRESHOLDS to determine which icon to display
 */
export const getTemperatureIcon = (temp: number | null): ComponentType<any> => {
  // if no data, return default icon
  if (temp === null) {
    return IconTemperatureSun;
  }

  // find the appropriate threshold
  for (let i = TEMPERATURE_ICON_THRESHOLDS.length - 1; i >= 0; i--) {
    if (temp >= TEMPERATURE_ICON_THRESHOLDS[i].temp) {
      return TEMPERATURE_ICON_THRESHOLDS[i].icon;
    }
  }

  // fallback to first threshold icon (should never happen)
  return TEMPERATURE_ICON_THRESHOLDS[0].icon;
};

export default getTemperatureIcon;
