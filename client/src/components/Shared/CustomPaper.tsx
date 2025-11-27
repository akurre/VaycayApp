import { appColors } from '@/theme';
import { Paper, useMantineColorScheme } from '@mantine/core';
import { ReactNode } from 'react';

interface CustomPaperProps {
  children: ReactNode;
  className?: string;
  p?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const CustomPaper = ({ children, className, p = 'lg' }: CustomPaperProps) => {
  const { colorScheme } = useMantineColorScheme();
  return (
    <Paper
      style={{
        backgroundColor: colorScheme === 'dark' ? appColors.dark.paper : appColors.light.surface,
      }}
      shadow="sm"
      p={p}
      withBorder
      className={`${className} h-full`}
    >
      {children}
    </Paper>
  );
};

export default CustomPaper;
