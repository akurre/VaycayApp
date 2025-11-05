import { Text } from '@mantine/core';
import Field from './Field';
import Divider from './Divider';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

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
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  return (
    <div className="mt-2">
      <Divider />
      <Text size="sm" fw={600} mb="xs" style={{ color: textColor }}>
        Temperature
      </Text>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Average" value={formatTemperature(avgTemperature) ?? 'N/A'} />
        <Field label="Max" value={formatTemperature(maxTemperature) ?? 'N/A'} />
        <Field label="Min" value={formatTemperature(minTemperature) ?? 'N/A'} />
      </div>
    </div>
  );
};

export default TemperatureSection;
