import { SegmentedControl, Tooltip } from '@mantine/core';
import { appColors } from '@/theme';
import { MapTheme } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import { TOGGLE_ICON_SIZE } from '@/constants';

interface MapToggleOption<T extends string> {
  value: T;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface MapToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: MapToggleOption<T>[];
}

const MapToggle = <T extends string>({
  value,
  onChange,
  options,
}: MapToggleProps<T>) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const iconColorUnselected = isLightMode ? appColors.light.textSecondary : appColors.dark.textSecondary

  return (
    <SegmentedControl
      value={value}
      color={isLightMode ? appColors.primaryLight : appColors.primaryDark}
      transitionDuration={300}
      onChange={(val) => onChange(val as T)}
      styles={{
        root: {
          backgroundColor: isLightMode
            ? appColors.light.toggleBackground
            : appColors.dark.toggleBackground,
          backdropFilter: 'blur(8px)',
        },
        label: {
          color: isLightMode ? appColors.light.text : appColors.dark.text,
          opacity: 1,
        },
      }}
      data={options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        const iconColor = isSelected ? undefined : iconColorUnselected;

        return {
          value: option.value,
          label: (
            <Tooltip label={option.label} withArrow>
              <div className="flex items-center justify-center">
                <Icon size={TOGGLE_ICON_SIZE} color={iconColor} />
              </div>
            </Tooltip>
          ),
        };
      })}
    />
  );
};

export default MapToggle;
