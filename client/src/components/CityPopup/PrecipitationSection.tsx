import Field from './Field';
import { formatValue } from '@/utils/dataFormatting/formatValue';
import GreaterSection from './GreaterSection';

interface PrecipitationSectionProps {
  precipitation: number | null;
  snowDepth: number | null;
}

const PrecipitationSection = ({ precipitation, snowDepth }: PrecipitationSectionProps) => {
  return (
    <GreaterSection title="Precipitation">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rainfall" value={formatValue(precipitation, ' mm')} />
        <Field label="Snow Depth" value={formatValue(snowDepth, ' cm')} />
      </div>
    </GreaterSection>
  );
};

export default PrecipitationSection;
