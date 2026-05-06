import { useEffect, useRef, useState } from 'react';
import { HoverCard, useComputedColorScheme } from '@mantine/core';
import MapViewToggle from '@/components/Map/MapViewToggle';
import MapDataToggle from '@/components/Map/MapDataToggle';
import TemperatureUnitToggle from '@/components/Map/TemperatureUnitToggle';
import MapThemeToggle from '@/components/Map/MapThemeToggle';
import DateSliderWrapper from '@/components/Navigation/DateSliderWrapper';
import HomeLocationContent from '@/components/Navigation/HomeLocationContent';
import HomeTriggerButton from '@/components/Navigation/HomeTriggerButton';
import DateTriggerButton from '@/components/Navigation/DateTriggerButton';
import CommandBarDivider from '@/components/Navigation/CommandBarDivider';
import {
  DATE_POPOVER_HIDDEN_OFFSET_PX,
  DATE_POPOVER_TRANSITION_MS,
  DATE_POPOVER_WIDTH_PX,
  HOME_POPOVER_WIDTH_PX,
  POPOVER_CLOSE_DELAY_MS,
  POPOVER_OFFSET_Y,
} from '@/const';
import useGlassTokens from '@/hooks/useGlassTokens';
import type { DataType, TemperatureUnit, ViewMode } from '@/types/mapTypes';

interface TopCommandBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dataType: DataType;
  onDataTypeChange: (type: DataType) => void;
  temperatureUnit: TemperatureUnit;
  onTemperatureUnitChange: (unit: TemperatureUnit) => void;
  isMonthly: boolean;
}

const TopCommandBar = ({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  dataType,
  onDataTypeChange,
  temperatureUnit,
  onTemperatureUnitChange,
  isMonthly,
}: TopCommandBarProps) => {
  const glass = useGlassTokens();
  const scheme = useComputedColorScheme('dark');
  const [homeOpen, setHomeOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const dateCloseTimerRef = useRef<number | null>(null);

  const cancelDateClose = () => {
    if (dateCloseTimerRef.current !== null) {
      window.clearTimeout(dateCloseTimerRef.current);
      dateCloseTimerRef.current = null;
    }
  };

  const openDate = () => {
    cancelDateClose();
    setDateOpen(true);
  };

  const scheduleDateClose = () => {
    cancelDateClose();
    dateCloseTimerRef.current = window.setTimeout(() => {
      setDateOpen(false);
      dateCloseTimerRef.current = null;
    }, POPOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => () => cancelDateClose(), []);

  return (
    <div className="absolute top-4 inset-x-0 z-30 flex flex-col items-center gap-2.5 pointer-events-none">
      <div
        className="flex items-center gap-2 rounded-xl p-1.5 pointer-events-auto"
        style={{
          background: glass.bg,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          border: `1px solid ${glass.border}`,
          boxShadow: glass.shadow,
        }}
      >
        <HoverCard
          // Force a remount on color-scheme change so the portaled dropdown
          // picks up the new glass tokens (its inline styles are read once).
          key={scheme}
          width={HOME_POPOVER_WIDTH_PX}
          position="bottom"
          offset={POPOVER_OFFSET_Y}
          shadow="md"
          withinPortal
          closeDelay={POPOVER_CLOSE_DELAY_MS}
          onOpen={() => setHomeOpen(true)}
          onClose={() => setHomeOpen(false)}
        >
          <HoverCard.Target>
            <div>
              <HomeTriggerButton isOpen={homeOpen} />
            </div>
          </HoverCard.Target>
          <HoverCard.Dropdown
            styles={{
              dropdown: {
                backgroundColor: glass.bgStrong,
                backdropFilter: glass.blurStrong,
                WebkitBackdropFilter: glass.blurStrong,
                border: `1px solid ${glass.borderLight}`,
                boxShadow: glass.shadow,
                color: glass.text,
              },
            }}
          >
            <HomeLocationContent />
          </HoverCard.Dropdown>
        </HoverCard>

        <CommandBarDivider color={glass.divider} />

        <div onMouseEnter={openDate} onMouseLeave={scheduleDateClose}>
          <DateTriggerButton
            isOpen={dateOpen}
            date={selectedDate}
            isMonthly={isMonthly}
          />
        </div>

        <CommandBarDivider color={glass.divider} />

        <MapViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <MapDataToggle dataType={dataType} onDataTypeChange={onDataTypeChange} />
        <TemperatureUnitToggle
          temperatureUnit={temperatureUnit}
          onTemperatureUnitChange={onTemperatureUnitChange}
        />

        <CommandBarDivider color={glass.divider} />

        <MapThemeToggle />
      </div>

      <div
        onMouseEnter={cancelDateClose}
        onMouseLeave={scheduleDateClose}
        style={{
          width: DATE_POPOVER_WIDTH_PX,
          opacity: dateOpen ? 1 : 0,
          marginTop: dateOpen ? 0 : DATE_POPOVER_HIDDEN_OFFSET_PX,
          pointerEvents: dateOpen ? 'auto' : 'none',
          transition: `opacity ${DATE_POPOVER_TRANSITION_MS}ms ease, margin-top ${DATE_POPOVER_TRANSITION_MS}ms ease`,
        }}
      >
        <DateSliderWrapper
          currentDate={selectedDate}
          onDateChange={onDateChange}
          isMonthly={isMonthly}
        />
      </div>
    </div>
  );
};

export default TopCommandBar;
