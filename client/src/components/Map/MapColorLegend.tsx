import { useState } from 'react';
import type { FC } from 'react';
import { Collapse, ColorSwatch, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { TEMP_THRESHOLDS, SUNSHINE_THRESHOLDS } from '@/const';
import { DataType } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import useGlassTokens from '@/hooks/useGlassTokens';
import useIsMobileOrSmall from '@/hooks/useIsMobileOrSmall';
import {
  convertTemperature,
  getTemperatureUnitSymbol,
} from '@/utils/tempFormatting/convertTemperature';

interface MapColorLegendProps {
  dataType: DataType;
}

const MapColorLegend: FC<MapColorLegendProps> = ({ dataType }) => {
  const [opened, setOpened] = useState(false);
  const isSunshine = dataType === DataType.Sunshine;
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);
  const unitSymbol = getTemperatureUnitSymbol(temperatureUnit);
  const glass = useGlassTokens();
  const isMobileOrSmall = useIsMobileOrSmall();

  // Convert RGB array to CSS rgb() string
  const rgbToString = (
    rgb: readonly [number, number, number] | [number, number, number]
  ) => {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  };

  // Format label text based on data type with proper typing
  const formatLabel = (index: number) => {
    if (isSunshine) {
      const threshold = SUNSHINE_THRESHOLDS[index];
      const nextThreshold = SUNSHINE_THRESHOLDS[index + 1];
      if (nextThreshold) {
        return `${threshold.percent} → ${nextThreshold.percent}%`;
      }
      return `${threshold.percent}%+`;
    } else {
      const threshold = TEMP_THRESHOLDS[index];
      const nextThreshold = TEMP_THRESHOLDS[index + 1];

      const convertedTemp = Math.round(
        convertTemperature(threshold.temp, temperatureUnit)
      );

      if (nextThreshold) {
        const convertedNextTemp = Math.round(
          convertTemperature(nextThreshold.temp, temperatureUnit)
        );
        return `${convertedTemp} → ${convertedNextTemp}${unitSymbol}`;
      }
      return `${convertedTemp}${unitSymbol}+`;
    }
  };

  const thresholds = isSunshine ? SUNSHINE_THRESHOLDS : TEMP_THRESHOLDS;
  const displayedIndices = thresholds.map((_, index) => index);

  const swatches = (
    <div className="flex flex-col gap-2">
      {displayedIndices.map((index) => {
        const threshold = thresholds[index];
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
              {formatLabel(index)}
            </Text>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="rounded-xl px-3.5 py-3 min-w-[120px]"
      style={{
        background: glass.bg,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        border: `1px solid ${glass.border}`,
        boxShadow: glass.shadow,
        color: glass.text,
      }}
    >
      {isMobileOrSmall ? (
        swatches
      ) : (
        <>
          <UnstyledButton
            onClick={() => setOpened((o) => !o)}
            className="flex items-center gap-1"
            style={{ color: 'currentColor' }}
          >
            <Text
              size="xs"
              fw={500}
              tt="uppercase"
              ff="monospace"
              style={{ color: 'currentColor', letterSpacing: '0.05em' }}
            >
              Legend
            </Text>
            <div
              className="flex items-center"
              style={{
                transition: 'transform 0.2s',
                transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <IconChevronDown
                size={12}
                color="currentColor"
                style={{ opacity: 0.6 }}
              />
            </div>
          </UnstyledButton>
          <Collapse in={opened}>
            <div className="pt-2">{swatches}</div>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default MapColorLegend;
