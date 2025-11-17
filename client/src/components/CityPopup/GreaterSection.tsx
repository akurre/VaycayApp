import { appColors } from '@/theme';
import { Divider, Text } from '@mantine/core';
import { ComponentType, ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
  icon?: ComponentType<{ size?: number; color?: string; stroke?: number }>;
}

const GreaterSection = ({ children, title, icon: IconComponent }: GreaterSectionProps) => {
  return (
    <div>
      <Divider />
      <div className="flex justify-between items-end">
        <div className="flex flex-col justify-between grow">
          <Text size="sm" fw={600} mb="xs" mt="sm" c="secondary-teal.5">
            {title}
          </Text>
          <div className="w-full">{children}</div>
        </div>
        {IconComponent && <IconComponent size={32} color={appColors.primary} />}
      </div>
    </div>
  );
};

export default GreaterSection;
