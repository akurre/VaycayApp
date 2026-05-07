import { Loader, Transition } from '@mantine/core';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import { MAP_DATA_LOADER_FADE_MS } from '@/const';

interface MapDataLoaderProps {
  dataType: DataType;
}

const MapDataLoader = ({ dataType }: MapDataLoaderProps) => {
  const isLoadingWeather = useWeatherStore((s) => s.isLoadingWeather);
  const isLoadingSunshine = useSunshineStore((s) => s.isLoadingSunshine);
  const isGesturing = useAppStore((s) => s.isGesturing);
  const isLoading =
    dataType === DataType.Sunshine ? isLoadingSunshine : isLoadingWeather;

  // Visible during the whole pan→flush window: gesturing, bounds query
  // in flight, or the post-load gesture grace still gating the flush.
  const visible = isGesturing || isLoading;

  return (
    <Transition
      mounted={visible}
      transition="fade"
      duration={MAP_DATA_LOADER_FADE_MS}
    >
      {(styles) => (
        <div
          style={styles}
          role="status"
          aria-live="polite"
          aria-label="Loading map data"
          className="absolute top-4 right-4 z-30 pointer-events-none"
        >
          <Loader size="sm" />
        </div>
      )}
    </Transition>
  );
};

export default MapDataLoader;
