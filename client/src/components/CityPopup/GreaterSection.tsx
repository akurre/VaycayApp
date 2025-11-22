import { appColors } from '@/theme';
import { Divider, Text } from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
  icon?: ComponentType<{ size?: number; color?: string; stroke?: number }>;
}

const GreaterSection = ({ children, title, icon: IconComponent }: GreaterSectionProps) => {
  return (
    <div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col justify-between grow">
          <div className="flex gap-3 items-center">
            <Text size="sm" fw={600} mb="xs" c="secondary-teal.5">
              {title}
            </Text>
            {IconComponent && <IconComponent size={16} color={appColors.primary} />}
          </div>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default GreaterSection;
