import { appColors } from '@/theme';
import { Paper, useMantineColorScheme } from '@mantine/core';
import { ReactNode } from 'react';

interface CustomPaperProps {
  children: ReactNode;
  className?: string;
}

const CustomPaper = ({ children, className }: CustomPaperProps) => {
  const { colorScheme } = useMantineColorScheme();
  return (
    <Paper
      style={{
        backgroundColor: colorScheme === 'dark' ? appColors.dark.paper : appColors.light.surface,
      }}
      shadow="sm"
      p="lg"
      withBorder
      className={`${className} h-full`}
    >
      {children}
    </Paper>
  );
};

export default CustomPaper;
