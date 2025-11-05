import { Text } from '@mantine/core';
import Field from './Field';
import Divider from './Divider';
import { formatValue } from '@/utils/dataFormatting/formatValue';

interface PrecipitationSectionProps {
  precipitation: number | null;
  snowDepth: number | null;
}

const PrecipitationSection = ({ precipitation, snowDepth }: PrecipitationSectionProps) => {
  return (
    <div>
      <Divider />
      <Text size="sm" fw={600} mb="xs">
        Precipitation
      </Text>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rainfall" value={formatValue(precipitation, ' mm')} />
        <Field label="Snow Depth" value={formatValue(snowDepth, ' cm')} />
      </div>
    </div>
  );
};

export default PrecipitationSection;
