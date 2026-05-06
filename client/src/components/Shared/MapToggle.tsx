import { SegmentedControl, Tooltip } from '@mantine/core';
import type { SegmentedControlProps } from '@mantine/core';
import type { ComponentType } from 'react';
import getIconSizeFromControlSize from '@/utils/map/getIconSizeFromControlSize';
import { secondaryOceanShades } from '@/theme';

interface MapToggleOption<T extends string> {
  value: T;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}

interface MapToggleProps<T extends string> extends Omit<
  SegmentedControlProps,
  'value' | 'onChange' | 'data'
> {
  value: T;
  onChange: (value: T) => void;
  options: MapToggleOption<T>[];
}

const MapToggle = <T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ...props
}: MapToggleProps<T>) => {
  const iconSize = getIconSizeFromControlSize(size);

  return (
    <SegmentedControl
      className="z-40"
      value={value}
      size={size}
      color={secondaryOceanShades[4]}
      bg="transparent"
      {...props}
      transitionDuration={300}
      onChange={(val) => onChange(val as T)}
      styles={{
        root: {
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
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
                <Icon size={iconSize} />
              </div>
            </Tooltip>
          ),
        };
      })}
    />
  );
};

export default MapToggle;
