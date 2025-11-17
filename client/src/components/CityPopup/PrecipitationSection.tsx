import Field from './Field';
import { formatValue } from '@/utils/dataFormatting/formatValue';
import GreaterSection from './GreaterSection';
import getPrecipitationIcon from '@/utils/iconMapping/getPrecipitationIcon';

interface PrecipitationSectionProps {
  precipitation: number | null;
  snowDepth: number | null;
}

const PrecipitationSection = ({ precipitation, snowDepth }: PrecipitationSectionProps) => {
  const precipitationIcon = getPrecipitationIcon(precipitation);
  return (
    <GreaterSection title="Precipitation" icon={precipitationIcon}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rainfall" value={formatValue(precipitation, ' mm')} />
        <Field label="Snow Depth" value={formatValue(snowDepth, ' cm')} />
      </div>
    </GreaterSection>
  );
};

export default PrecipitationSection;
