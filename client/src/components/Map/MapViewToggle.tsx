import { IconChartBubble, IconMapPin } from '@tabler/icons-react';
import MapToggle from '@/components/Shared/MapToggle';
import { ViewMode } from '@/types/mapTypes';

interface MapViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const MapViewToggle = ({ viewMode, onViewModeChange }: MapViewToggleProps) => {
  return (
    <MapToggle
      value={viewMode}
      onChange={onViewModeChange}
      options={[
        {
          value: ViewMode.Markers,
          label: 'Marker View',
          icon: IconMapPin,
        },
        {
          value: ViewMode.Heatmap,
          label: 'Heatmap View',
          icon: IconChartBubble,
        },
      ]}
    />
  );
};

export default MapViewToggle;
