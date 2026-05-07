import { Loader, Transition } from '@mantine/core';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { DataType } from '@/types/mapTypes';

interface MapDataLoaderProps {
  dataType: DataType;
}

const MapDataLoader = ({ dataType }: MapDataLoaderProps) => {
  const isLoadingWeather = useWeatherStore((s) => s.isLoadingWeather);
  const isLoadingSunshine = useSunshineStore((s) => s.isLoadingSunshine);
  const isLoading =
    dataType === DataType.Sunshine ? isLoadingSunshine : isLoadingWeather;

  return (
    <Transition mounted={isLoading} transition="fade" duration={150}>
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
