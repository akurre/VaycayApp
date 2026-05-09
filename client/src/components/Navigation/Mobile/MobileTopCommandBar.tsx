import type { DataType, TemperatureUnit, ViewMode } from '@/types/mapTypes';
import TemperatureUnitToggle from '@/components/Map/TemperatureUnitToggle';
import { MOBILE_TOP_BAR_TOP_PX, MOBILE_BAR_INSET_PX } from '@/const';

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

// Stub — full chrome lands in Task 3 (MobileTopCommandBar + HamburgerSheet).
const MobileTopCommandBar = ({
  temperatureUnit,
  onTemperatureUnitChange,
}: MobileTopCommandBarProps) => {
  return (
    <div
      className="absolute z-20 flex items-center"
      style={{
        top: MOBILE_TOP_BAR_TOP_PX,
        left: MOBILE_BAR_INSET_PX,
        right: MOBILE_BAR_INSET_PX,
      }}
    >
      <TemperatureUnitToggle
        temperatureUnit={temperatureUnit}
        onTemperatureUnitChange={onTemperatureUnitChange}
      />
    </div>
  );
};

export default MobileTopCommandBar;
