import { memo } from 'react';
import Field from './Field';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import GreaterSection from './GreaterSection';
import getTemperatureIcon from '@/utils/iconMapping/getTemperatureIcon';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface TemperatureSectionProps {
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  comparisonAvgTemperature?: number | null;
  comparisonMaxTemperature?: number | null;
  comparisonMinTemperature?: number | null;
}

const TemperatureSection = ({
  avgTemperature,
  maxTemperature,
  minTemperature,
  comparisonAvgTemperature,
  comparisonMaxTemperature,
  comparisonMinTemperature,
}: TemperatureSectionProps) => {
  const temperatureIcon = getTemperatureIcon(avgTemperature);
  const hasComparison =
    comparisonAvgTemperature !== undefined ||
    comparisonMaxTemperature !== undefined ||
    comparisonMinTemperature !== undefined;

  return (
    <GreaterSection title="Temperature" icon={temperatureIcon}>
      <div className="flex gap-10">
        <Field
          label="Average"
          value={formatTemperature(avgTemperature) ?? 'N/A'}
          valueColor={hasComparison ? CITY1_PRIMARY_COLOR : undefined}
          secondaryValue={
            hasComparison
              ? formatTemperature(comparisonAvgTemperature ?? null) ?? 'N/A'
              : undefined
          }
          secondaryValueColor={hasComparison ? CITY2_PRIMARY_COLOR : undefined}
        />
        <Field
          label="Max"
          value={formatTemperature(maxTemperature) ?? 'N/A'}
          valueColor={hasComparison ? CITY1_PRIMARY_COLOR : undefined}
          secondaryValue={
            hasComparison
              ? formatTemperature(comparisonMaxTemperature ?? null) ?? 'N/A'
              : undefined
          }
          secondaryValueColor={hasComparison ? CITY2_PRIMARY_COLOR : undefined}
        />
        <Field
          label="Min"
          value={formatTemperature(minTemperature) ?? 'N/A'}
          valueColor={hasComparison ? CITY1_PRIMARY_COLOR : undefined}
          secondaryValue={
            hasComparison
              ? formatTemperature(comparisonMinTemperature ?? null) ?? 'N/A'
              : undefined
          }
          secondaryValueColor={hasComparison ? CITY2_PRIMARY_COLOR : undefined}
        />
      </div>
    </GreaterSection>
  );
};

export default memo(TemperatureSection);
