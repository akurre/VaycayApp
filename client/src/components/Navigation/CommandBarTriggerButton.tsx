import type { ComponentType, ReactNode } from 'react';
import { Button, useMantineColorScheme } from '@mantine/core';
import { TOGGLE_ICON_SIZE } from '@/const';
import { secondaryOceanShades } from '@/theme';

interface IconProps {
  size?: number;
}

interface CommandBarTriggerButtonProps {
  isOpen: boolean;
  icon: ComponentType<IconProps>;
  children: ReactNode;
}

const CommandBarTriggerButton = ({
  isOpen,
  icon: Icon,
  children,
}: CommandBarTriggerButtonProps) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Button
      variant={isOpen ? 'light' : 'outline'}
      size="xs"
      color={isDark ? secondaryOceanShades[2] : secondaryOceanShades[4]}
      leftSection={<Icon size={TOGGLE_ICON_SIZE} />}
    >
      {children}
    </Button>
  );
};

export default CommandBarTriggerButton;
