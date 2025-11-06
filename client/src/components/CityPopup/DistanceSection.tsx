import { Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { calculateDistanceFromHome } from '@/utils/location/calculateDistanceFromHome';
import { formatDistance } from '@/utils/location/formatDistance';
import CustomLoader from '@/components/Shared/CustomLoader';
import Field from './Field';
import Divider from './Divider';

interface DistanceSectionProps {
  lat: number | null;
  long: number | null;
}

const DistanceSection = ({ lat, long }: DistanceSectionProps) => {
  const homeLocation = useAppStore((state) => state.homeLocation);
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!lat || !long || !homeLocation) {
      setDistance(null);
      return;
    }

    // use settimeout to defer calculation and show loading state
    setIsCalculating(true);
    const timeoutId = setTimeout(() => {
      const calculatedDistance = calculateDistanceFromHome(lat, long);
      setDistance(calculatedDistance);
      setIsCalculating(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [lat, long, homeLocation]);

  return (
    <div>
      <Divider />
      {homeLocation ? (
        isCalculating ? (
          <div className="flex items-center gap-2">
            <Text size="sm">Distance from home</Text>
            <CustomLoader />
          </div>
        ) : distance !== null ? (
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
