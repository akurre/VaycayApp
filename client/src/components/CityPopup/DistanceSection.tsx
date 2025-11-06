import { Divider, Text } from '@mantine/core';
import { useAppStore } from '@/stores/useAppStore';
import { calculateDistanceFromHome } from '@/utils/location/calculateDistanceFromHome';
import { formatDistance } from '@/utils/location/formatDistance';
import Field from './Field';

interface DistanceSectionProps {
  lat: number | null;
  long: number | null;
}

const DistanceSection = ({ lat, long }: DistanceSectionProps) => {
  const homeLocation = useAppStore((state) => state.homeLocation);

  // calculate distance synchronously - it's instant
  const distance = lat && long ? calculateDistanceFromHome(lat, long) : null;

  return (
    <div>
      <Divider />
      {homeLocation ? (
        distance !== null ? (
          <Field label="Distance from home" value={formatDistance(distance)} />
        ) : null
      ) : (
        <Text size="sm" c="dimmed">
          Set home location to see distance
        </Text>
      )}
    </div>
  );
};

export default DistanceSection;
