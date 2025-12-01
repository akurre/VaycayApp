import { IconTemperatureCelsius, IconTemperatureFahrenheit } from '@tabler/icons-react';
import MapToggle from '@/components/Shared/MapToggle';
import { TemperatureUnit } from '@/types/mapTypes';

interface TemperatureUnitToggleProps {
  temperatureUnit: TemperatureUnit;
  onTemperatureUnitChange: (unit: TemperatureUnit) => void;
}

const TemperatureUnitToggle = ({
  temperatureUnit,
  onTemperatureUnitChange,
}: TemperatureUnitToggleProps) => {
  return (
    <MapToggle
      value={temperatureUnit}
      size="lg"
      onChange={onTemperatureUnitChange}
      options={[
        {
          value: TemperatureUnit.Celsius,
          label: '°C',
          icon: IconTemperatureCelsius,
        },
        {
          value: TemperatureUnit.Fahrenheit,
          label: '°F',
          icon: IconTemperatureFahrenheit,
        },
      ]}
    />
  );
};

export default TemperatureUnitToggle;
