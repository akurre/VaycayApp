import { useState } from 'react';
import type { FC } from 'react';
import {
  Collapse,
  ColorSwatch,
  Group,
  Text,
  ActionIcon,
  Button,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { TEMP_THRESHOLDS, SUNSHINE_THRESHOLDS } from '@/const';
import { DataType } from '@/types/mapTypes';

interface MapColorLegendProps {
  dataType: DataType;
}

const MapColorLegend: FC<MapColorLegendProps> = ({ dataType }) => {
  const [opened, setOpened] = useState(true);
  const isSunshine = dataType === DataType.Sunshine;

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
        return `${threshold.hours}-${nextThreshold.hours}h`;
      }
      return `${threshold.hours}h+`;
    } else {
      const threshold = TEMP_THRESHOLDS[index];
      const nextThreshold = TEMP_THRESHOLDS[index + 1];
      if (nextThreshold) {
        return `${threshold.temp}-${nextThreshold.temp}°C`;
      }
      return `${threshold.temp}°C+`;
    }
  };

  // Select representative thresholds to avoid overcrowding
  // Show every other threshold for a cleaner look
  const thresholds = isSunshine ? SUNSHINE_THRESHOLDS : TEMP_THRESHOLDS;
  const displayedIndices = thresholds
    .map((_, index) => index)
    .filter((index) => index % 2 === 0);

  return (
    <div>
      <div className='flex gap-4 pb-2'>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => setOpened((o) => !o)}
        >
          <Text size="xs" className="font-mono">
            Legend
          </Text>
          <ActionIcon
            variant="subtle"
            size="compact-xs"
            style={{
              padding: 0,
              minWidth: 'auto',
              transition: 'transform 0.2s',
              transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <IconChevronDown size={12} style={{ opacity: 0.6 }} />
          </ActionIcon>
        </Button>
      </div>
      <Collapse in={opened}>
        <div className="flex flex-col gap-2">
          {displayedIndices.map((index) => {
            const threshold = thresholds[index];

            return (
              <Group key={index} gap="xs" wrap="nowrap">
                <ColorSwatch
                  color={rgbToString(threshold.color)}
                  size={16}
                  style={{ minWidth: 16 }}
                />
                <Text size="xs" style={{ opacity: 0.6, whiteSpace: 'nowrap' }}>
                  {formatLabel(index)}
                </Text>
              </Group>
            );
          })}
        </div>
      </Collapse>
    </div>
  );
};

export default MapColorLegend;
