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

const MapToggle = <T extends string>({ value, onChange, options }: MapToggleProps<T>) => {
  return (
    <SegmentedControl
      value={value}
      transitionDuration={300}
      onChange={(val) => onChange(val as T)}
      styles={{
        root: {
          backdropFilter: 'blur(8px)',
        },
        label: {
          opacity: 1,
        },
      }}
      data={options.map((option) => {
        const Icon = option.icon;

        return {
          value: option.value,
          label: (
            <Tooltip label={option.label} withArrow>
              <div className="flex items-center justify-center">
                <Icon size={TOGGLE_ICON_SIZE} />
              </div>
            </Tooltip>
          ),
        };
      })}
    />
  );
};

export default MapToggle;
