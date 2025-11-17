import Field from './Field';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import GreaterSection from './GreaterSection';

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
  return (
    <div className="mt-2">
      <GreaterSection title="Temperature">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Average" value={formatTemperature(avgTemperature) ?? 'N/A'} />
          <Field label="Max" value={formatTemperature(maxTemperature) ?? 'N/A'} />
          <Field label="Min" value={formatTemperature(minTemperature) ?? 'N/A'} />
        </div>
      </GreaterSection>
    </div>
  );
};

export default TemperatureSection;
