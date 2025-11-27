import type { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import DistanceSection from './DistanceSection';
import GreaterSection from './GreaterSection';
import CustomPaper from '../Shared/CustomPaper';
import { Popover, Button, Badge } from '@mantine/core';

interface AdditionalInfoProps {
  city: WeatherDataUnion;
  isShowCity?: boolean;
}

const AdditionalInfo = ({ city, isShowCity }: AdditionalInfoProps) => {
  return (
    <CustomPaper className="w-3/12 flex flex-col">
      {isShowCity && (
        <div className='pb-2'>
          <Badge variant='light'>{city.city}</Badge>
        </div>
      )}
      <GreaterSection title="City Info">
        <div className="flex flex-col">
          <div className="pb-3 flex-col">
            <div className="flex mb-3">
              {city.population && (
                <Field label="Population" value={city.population.toLocaleString()} />
              )}
            </div>
            <DistanceSection lat={city.lat} long={city.long} />
          </div>
          <div className="pt-3 flex justify-center">
            <Popover position="top" withArrow shadow="md">
              <Popover.Target>
                <Button variant="subtle" size="compact-xs">
                  More Info
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                {city.stationName && (
                  <div>
                    <Field label="Weather Station" value={city.stationName} />
                  </div>
                )}
                {city.lat && city.long && (
                  <Field
                    label="Coordinates"
                    value={`${city.lat.toFixed(4)}°, ${city.long.toFixed(4)}°`}
                    monospace
                  />
                )}
              </Popover.Dropdown>
            </Popover>
          </div>
        </div>
      </GreaterSection>
    </CustomPaper>
  );
};

export default AdditionalInfo;
