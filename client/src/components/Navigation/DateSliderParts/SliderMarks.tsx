import { FC } from 'react';
import { Text } from '@mantine/core';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';
import CustomPopover from '@/components/Shared/CustomPopover';

interface SliderMarksProps {
  marks: Array<{ value: number; label: string }>;
  min: number;
  max: number;
}

const SliderMarks: FC<SliderMarksProps> = ({ marks, min, max }) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;

  // use appropriate text color and shadow based on theme
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;
  const textShadow = isLightMode ? appColors.light.textShadow : appColors.dark.textShadow;

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
                  textShadow,
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
