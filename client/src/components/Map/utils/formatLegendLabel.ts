import { TEMP_THRESHOLDS, SUNSHINE_THRESHOLDS } from '@/const';
import type { TemperatureUnit } from '@/types/mapTypes';
import {
  convertTemperature,
  getTemperatureUnitSymbol,
} from '@/utils/tempFormatting/convertTemperature';

const formatLegendLabel = (
  index: number,
  isSunshine: boolean,
  temperatureUnit: TemperatureUnit
): string => {
  if (isSunshine) {
    const threshold = SUNSHINE_THRESHOLDS[index];
    const nextThreshold = SUNSHINE_THRESHOLDS[index + 1];
    if (nextThreshold) {
      return `${threshold.percent} → ${nextThreshold.percent}%`;
    }
    return `${threshold.percent}%+`;
  }

  const threshold = TEMP_THRESHOLDS[index];
  const nextThreshold = TEMP_THRESHOLDS[index + 1];
  const unitSymbol = getTemperatureUnitSymbol(temperatureUnit);
  const convertedTemp = Math.round(
    convertTemperature(threshold.temp, temperatureUnit)
  );

  if (nextThreshold) {
    const convertedNextTemp = Math.round(
      convertTemperature(nextThreshold.temp, temperatureUnit)
    );
    return `${convertedTemp} → ${convertedNextTemp}${unitSymbol}`;
  }
  return `${convertedTemp}${unitSymbol}+`;
};

export default formatLegendLabel;
