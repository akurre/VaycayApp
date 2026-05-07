import { Loader, Transition } from '@mantine/core';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';

interface MapDataLoaderProps {
  dataType: DataType;
}

const MapDataLoader = ({ dataType }: MapDataLoaderProps) => {
  const isLoadingWeather = useWeatherStore((s) => s.isLoadingWeather);
  const isLoadingSunshine = useSunshineStore((s) => s.isLoadingSunshine);
  const isGesturing = useAppStore((s) => s.isGesturing);
  const isLoading =
    dataType === DataType.Sunshine ? isLoadingSunshine : isLoadingWeather;

  // Show during the whole pan→data-flush window: while the user is actively
  // gesturing, while the bounds query is in flight, AND while the post-load
  // gesture grace is still gating the marker flush.
  const visible = isGesturing || isLoading;

  return (
    <Transition mounted={visible} transition="fade" duration={150}>
      {(styles) => (
        <div
          style={styles}
          className="absolute top-4 right-4 z-30 pointer-events-none"
        >
          <Loader size="sm" />
        </div>
      )}
    </Transition>
  );
};

export default MapDataLoader;
