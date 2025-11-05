import { Text } from '@mantine/core';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';

interface FieldProps {
  label: string;
  value: string | number;
  monospace?: boolean;
}

const Field = ({ label, value, monospace }: FieldProps) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const textSecondaryColor = isLightMode ? appColors.light.textSecondary : appColors.dark.textSecondary;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  return (
    <div>
      <Text size="sm" style={{ color: textSecondaryColor }}>
        {label}
      </Text>
      <Text size="md" ff={monospace ? 'monospace' : undefined} style={{ color: textColor }}>
        {value}
      </Text>
    </div>
  );
};

export default Field;
