import { memo } from 'react';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import GreaterSection from './GreaterSection';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';
import CityBadge from './graphs/CityBadge';
import { useAppStore } from '@/stores/useAppStore';

interface TemperatureSectionProps {
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  comparisonAvgTemperature?: number | null;
  comparisonMaxTemperature?: number | null;
  comparisonMinTemperature?: number | null;
  comparisonCity?: string;
  baseCity?: string;
}

const TemperatureSection = ({
  avgTemperature,
  maxTemperature,
  minTemperature,
  comparisonAvgTemperature,
  comparisonMaxTemperature,
  comparisonMinTemperature,
  comparisonCity,
  baseCity,
}: TemperatureSectionProps) => {
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const hasComparison =
    comparisonAvgTemperature !== undefined ||
    comparisonMaxTemperature !== undefined ||
    comparisonMinTemperature !== undefined;

  return (
    <GreaterSection className="w-full h-full" title="Temperature">
      <div className="flex flex-col gap-2">
        {/* Column headers - only show when comparing */}
        {hasComparison && comparisonCity && baseCity && (
          <div
            className={`grid ${hasComparison ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-center`}
          >
            <div></div> {/* Empty space for label column */}
            <CityBadge cityName={baseCity} />
            <CityBadge cityName={comparisonCity} isComparison={true} />
          </div>
        )}

        {/* Data rows */}
        <div
          className={`grid ${hasComparison ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-center`}
        >
          <div className="font-medium text-sm">Average</div>
          <div
            className="text-sm"
            style={{ color: hasComparison ? CITY1_PRIMARY_COLOR : undefined }}
          >
            {formatTemperature(avgTemperature, temperatureUnit) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(
                comparisonAvgTemperature ?? null,
                temperatureUnit
              ) ?? 'N/A'}
            </div>
          )}
        </div>

        <div
          className={`grid ${hasComparison ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-center`}
        >
          <div className="font-medium text-sm">Min</div>
          <div
            className="text-sm"
            style={{ color: hasComparison ? CITY1_PRIMARY_COLOR : undefined }}
          >
            {formatTemperature(minTemperature, temperatureUnit) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(
                comparisonMinTemperature ?? null,
                temperatureUnit
              ) ?? 'N/A'}
            </div>
          )}
        </div>

        <div
          className={`grid ${hasComparison ? 'grid-cols-3' : 'grid-cols-2'} gap-2 items-center`}
        >
          <div className="font-medium text-sm">Max</div>
          <div
            className="text-sm"
            style={{ color: hasComparison ? CITY1_PRIMARY_COLOR : undefined }}
          >
            {formatTemperature(maxTemperature, temperatureUnit) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(
                comparisonMaxTemperature ?? null,
                temperatureUnit
              ) ?? 'N/A'}
            </div>
          )}
        </div>
      </div>
    </GreaterSection>
  );
};

export default memo(TemperatureSection);
