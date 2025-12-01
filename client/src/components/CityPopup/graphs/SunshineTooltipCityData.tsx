import { Text } from '@mantine/core';
import CityBadge from './CityBadge';

interface SunshineTooltipCityDataProps {
  cityName?: string;
  hours: number;
  theoreticalMax?: number | null;
  textColor: string;
  isComparison?: boolean;
  hasComparisonData?: boolean;
}

const SunshineTooltipCityData = ({
  cityName,
  hours,
  theoreticalMax,
  textColor,
  isComparison = false,
  hasComparisonData = false,
}: SunshineTooltipCityDataProps) => {
  const clearSkiesPercentage =
    typeof theoreticalMax === 'number' && theoreticalMax > 0
      ? ((hours / theoreticalMax) * 100).toFixed(0)
      : null;

  // single city layout: badge on its own line
  if (!hasComparisonData && !isComparison) {
    return (
      <div className="flex flex-col mb-2">
        {cityName && (
          <div className="mb-1">
            <CityBadge cityName={cityName} />
          </div>
        )}
        <Text size="sm" c={textColor}>
          {hours.toFixed(1)} hours
        </Text>
        {clearSkiesPercentage && (
          <Text size="xs" c={textColor} style={{ opacity: 0.8 }}>
            {clearSkiesPercentage}% clear skies
          </Text>
        )}
      </div>
    );
  }

  // comparison mode: badge inline with data
  return (
    <div className="flex items-start gap-2 mb-2 mt-2">
      {cityName && <CityBadge cityName={cityName} isComparison={isComparison} />}
      <div className="flex flex-col">
        <Text size="sm" c={textColor}>
          {hours.toFixed(1)} hours
        </Text>
        {clearSkiesPercentage && (
          <Text size="xs" c={textColor} style={{ opacity: 0.8 }}>
            {clearSkiesPercentage}% clear skies
          </Text>
        )}
      </div>
    </div>
  );
};

export default SunshineTooltipCityData;
