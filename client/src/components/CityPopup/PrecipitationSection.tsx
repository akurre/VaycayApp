import { Text } from '@mantine/core';
import Field from './Field';
import Divider from './Divider';
import { formatValue } from '@/utils/dataFormatting/formatValue';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

interface PrecipitationSectionProps {
  precipitation: number | null;
  snowDepth: number | null;
}

const PrecipitationSection = ({ precipitation, snowDepth }: PrecipitationSectionProps) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  return (
    <div>
      <Divider />
      <Text size="sm" fw={600} mb="xs" style={{ color: textColor }}>
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
