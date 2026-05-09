import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMenu2 } from '@tabler/icons-react';
import type { DataType, TemperatureUnit, ViewMode } from '@/types/mapTypes';
import MapViewToggle from '@/components/Map/MapViewToggle';
import MapDataToggle from '@/components/Map/MapDataToggle';
import TemperatureUnitToggle from '@/components/Map/TemperatureUnitToggle';
import CommandBarDivider from '@/components/Navigation/CommandBarDivider';
import HamburgerSheet from './HamburgerSheet';
import useGlassTokens from '@/hooks/useGlassTokens';
import {
  MOBILE_TOP_BAR_TOP_PX,
  MOBILE_BAR_INSET_PX,
  MOBILE_BAR_HEIGHT_PX,
  MOBILE_BAR_RADIUS_PX,
  MOBILE_ICON_BUTTON_SIZE_PX,
} from '@/const';

interface MobileTopCommandBarProps {
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

const MobileTopCommandBar = ({
  viewMode,
  onViewModeChange,
  dataType,
  onDataTypeChange,
  temperatureUnit,
  onTemperatureUnitChange,
}: MobileTopCommandBarProps) => {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const glass = useGlassTokens();

  return (
    <>
      <div
        className="absolute z-20 flex items-center gap-1 px-2"
        style={{
          top: MOBILE_TOP_BAR_TOP_PX,
          left: MOBILE_BAR_INSET_PX,
          right: MOBILE_BAR_INSET_PX,
          height: MOBILE_BAR_HEIGHT_PX,
          borderRadius: MOBILE_BAR_RADIUS_PX,
          background: glass.bg,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          border: `1px solid ${glass.border}`,
          boxShadow: glass.shadow,
        }}
        data-testid="mobile-top-bar"
      >
        <ActionIcon
          variant="subtle"
          size={MOBILE_ICON_BUTTON_SIZE_PX}
          onClick={openDrawer}
          aria-label="Open menu"
          data-testid="hamburger-button"
        >
          <IconMenu2 size={20} />
        </ActionIcon>

        <CommandBarDivider color={glass.divider} />

        <MapViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <MapDataToggle dataType={dataType} onDataTypeChange={onDataTypeChange} />

        <CommandBarDivider color={glass.divider} />

        <TemperatureUnitToggle
          temperatureUnit={temperatureUnit}
          onTemperatureUnitChange={onTemperatureUnitChange}
        />
      </div>

      <HamburgerSheet opened={drawerOpened} onClose={closeDrawer} />
    </>
  );
};

export default MobileTopCommandBar;
