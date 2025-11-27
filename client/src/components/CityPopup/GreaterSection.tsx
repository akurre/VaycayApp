import { Text, useMantineColorScheme } from '@mantine/core';
import type { ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
  className?: string;
}

const GreaterSection = ({ children, title, className }: GreaterSectionProps) => {
  const { colorScheme } = useMantineColorScheme();
  const titleColor = colorScheme === 'dark' ? 'primary-red.5' : 'primary-red.7';
  const classNames = `${className} pb-3`
  return (
    <div className={classNames}>
      <div className="flex flex-col justify-between grow">
        <div className="flex gap-3 items-center pb-2">
          <Text size="sm" fw={600} c={titleColor}>
            {title}
          </Text>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
};

export default GreaterSection;
