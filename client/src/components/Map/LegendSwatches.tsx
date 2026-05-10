import type { FC } from 'react';
import { ColorSwatch, Text } from '@mantine/core';
import { TEMP_THRESHOLDS, SUNSHINE_THRESHOLDS } from '@/const';
import { DataType } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import rgbToString from '@/components/Map/utils/rgbToString';
import formatLegendLabel from '@/components/Map/utils/formatLegendLabel';

interface LegendSwatchesProps {
  dataType: DataType;
}

const LegendSwatches: FC<LegendSwatchesProps> = ({ dataType }) => {
  const temperatureUnit = useAppStore((s) => s.temperatureUnit);
  const isSunshine = dataType === DataType.Sunshine;
  const thresholds = isSunshine ? SUNSHINE_THRESHOLDS : TEMP_THRESHOLDS;

  return (
    <div className="flex flex-col gap-2">
      {thresholds.map((threshold, index) => {
        const keyValue =
          'temp' in threshold ? threshold.temp : threshold.percent;

        return (
          <div key={keyValue} className="flex items-center gap-2 flex-nowrap">
            <ColorSwatch
              color={rgbToString(threshold.color)}
              size={16}
              style={{ minWidth: 16 }}
            />
            <Text
              size="xs"
              style={{
                color: 'currentColor',
                opacity: 0.6,
                whiteSpace: 'nowrap',
              }}
            >
              {formatLegendLabel(index, isSunshine, temperatureUnit)}
            </Text>
          </div>
        );
      })}
    </div>
  );
};

export default LegendSwatches;
