import { Divider, Text } from '@mantine/core';
import { ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
}

const GreaterSection = ({ children, title }: GreaterSectionProps) => {
  return (
    <div>
      <Divider />
      <Text size="sm" fw={600} mb="xs" mt="sm">
        {title}
      </Text>
      <div>
        {children}
      </div>
    </div>
  );
};

export default GreaterSection;
