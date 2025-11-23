import { Text, useMantineColorScheme } from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
  icon?: ComponentType<{ size?: number; color?: string; stroke?: number }>;
}

const GreaterSection = ({ children, title, icon: IconComponent }: GreaterSectionProps) => {
  const { colorScheme } = useMantineColorScheme();
  const titleColor = colorScheme === 'dark' ? 'primary-red.5' : 'primary-red.7';

  return (
    <div className="pb-3">
      <div className="flex flex-col justify-between grow">
        <div className="flex gap-3 items-center pb-2">
          <Text size="sm" fw={600} c={titleColor}>
            {title}
          </Text>
          {IconComponent && <IconComponent size={16} color="var(--mantine-primary-color-filled)" />}
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default GreaterSection;
