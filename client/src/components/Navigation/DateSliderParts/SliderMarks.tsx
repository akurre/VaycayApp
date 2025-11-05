import { FC } from 'react';
import { Text, useMantineColorScheme } from '@mantine/core';
import CustomPopover from '@/components/shared/CustomPopover';
import { appColors } from '@/theme';

interface SliderMarksProps {
  marks: Array<{ value: number; label: string }>;
  min: number;
  max: number;
}

const SliderMarks: FC<SliderMarksProps> = ({ marks, min, max }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  
  // use light text on dark map background for contrast
  const textColor = isDark ? appColors.light.text : appColors.dark.text;
  
  return (
    <div className="relative mt-1">
      {marks.map((mark) => {
        const markPosition = ((mark.value - min) / (max - min)) * 100;
        return (
          <div
            key={mark.value}
            className="absolute -translate-x-1/2"
            style={{ left: `${markPosition}%` }}
          >
            <CustomPopover showBackground={false} size="xxs" direction="up">
              <Text 
                size="xs" 
                fw={500}
                style={{
                  color: textColor,
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.6)'
                }}
              >
                {mark.label}
              </Text>
            </CustomPopover>
          </div>
        );
      })}
    </div>
  );
};

export default SliderMarks;
