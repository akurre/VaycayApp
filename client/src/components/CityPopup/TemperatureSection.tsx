import { memo } from 'react';
import Field from './Field';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import GreaterSection from './GreaterSection';

import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';
import { Badge } from '@mantine/core';

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
            <Badge variant="light">{baseCity}</Badge>
            <Badge variant="light" style={{ color: CITY2_PRIMARY_COLOR }}>
              {comparisonCity}
            </Badge>
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
            {formatTemperature(avgTemperature) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(comparisonAvgTemperature ?? null) ?? 'N/A'}
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
            {formatTemperature(minTemperature) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(comparisonMinTemperature ?? null) ?? 'N/A'}
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
            {formatTemperature(maxTemperature) ?? 'N/A'}
          </div>
          {hasComparison && (
            <div className="text-sm" style={{ color: CITY2_PRIMARY_COLOR }}>
              {formatTemperature(comparisonMaxTemperature ?? null) ?? 'N/A'}
            </div>
          )}
        </div>
      </div>
    </GreaterSection>
  );
};

export default memo(TemperatureSection);
