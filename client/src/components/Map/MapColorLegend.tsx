import { useState } from 'react';
import type { FC } from 'react';
import { Collapse, UnstyledButton, Text } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { DataType } from '@/types/mapTypes';
import useGlassTokens from '@/hooks/useGlassTokens';
import useIsMobileOrSmall from '@/hooks/useIsMobileOrSmall';
import LegendSwatches from '@/components/Map/LegendSwatches';

interface MapColorLegendProps {
  dataType: DataType;
}

const MapColorLegend: FC<MapColorLegendProps> = ({ dataType }) => {
  const [opened, setOpened] = useState(false);
  const glass = useGlassTokens();
  const isMobileOrSmall = useIsMobileOrSmall();

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
        <LegendSwatches dataType={dataType} />
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
            <div className="pt-2">
              <LegendSwatches dataType={dataType} />
            </div>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default MapColorLegend;
