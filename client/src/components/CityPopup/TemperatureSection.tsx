import { memo } from 'react';
import Field from './Field';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import GreaterSection from './GreaterSection';
import getTemperatureIcon from '@/utils/iconMapping/getTemperatureIcon';

interface TemperatureSectionProps {
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
}

const TemperatureSection = ({
  avgTemperature,
  maxTemperature,
  minTemperature,
}: TemperatureSectionProps) => {
  const temperatureIcon = getTemperatureIcon(avgTemperature);
  return (
      <GreaterSection title="Temperature" icon={temperatureIcon}>
        <div className="flex gap-10">
          <Field label="Average" value={formatTemperature(avgTemperature) ?? 'N/A'} />
          <Field label="Max" value={formatTemperature(maxTemperature) ?? 'N/A'} />
          <Field label="Min" value={formatTemperature(minTemperature) ?? 'N/A'} />
        </div>
      </GreaterSection>
  );
};

export default memo(TemperatureSection);
