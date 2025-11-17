import { Divider, Text } from '@mantine/core';
import { Icon123 } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface GreaterSectionProps {
  children: ReactNode;
  title: string;
  icon?: React.ComponentType<any>;
}

const GreaterSection = ({ children, title, icon: IconComponent = Icon123 }: GreaterSectionProps) => {
  return (
    <div>
      <Divider />
      <div className='flex justify-between items-end'>
        <div className='flex flex-col justify-between grow'>
          <Text size="sm" fw={600} mb="xs" mt="sm" c="secondary-teal.5">
            {title}
          </Text>
          <div className='w-full'>
            {children}
          </div>
        </div>
        <IconComponent size={32} />
      </div>
    </div>
  );
};

export default GreaterSection;
