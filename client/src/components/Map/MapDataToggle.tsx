import { IconBrightness2, IconTemperature } from '@tabler/icons-react';
import MapToggle from '@/components/Shared/MapToggle';
import { DataType } from '@/types/mapTypes';

interface MapDataToggleProps {
  dataType: DataType;
  onDataTypeChange: (type: DataType) => void;
}

const MapDataToggle = ({ dataType, onDataTypeChange }: MapDataToggleProps) => {
  return (
    <MapToggle
      value={dataType}
      size="lg"
      onChange={onDataTypeChange}
      options={[
        {
          value: DataType.Temperature,
          label: 'Temperature',
          icon: IconTemperature,
        },
        {
          value: DataType.Sunshine,
          label: 'Sunshine',
          icon: IconBrightness2,
        },
      ]}
    />
  );
};

export default MapDataToggle;
