import { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import DistanceSection from './DistanceSection';
import { Button, Popover } from '@mantine/core';

interface AdditionalInfoProps {
  city: WeatherDataUnion;
}

const AdditionalInfo = ({ city }: AdditionalInfoProps) => (
  <>
    <div className='flex justify-between'>
      {city.population && (
        <div>
          <Field label="Population" value={city.population.toLocaleString()} />
        </div>
      )}
      <Popover position="bottom" withArrow shadow="md">
        <Popover.Target>
          {/* varient below doesnt change anything */}
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
            <Field label="Coordinates" value={`${city.lat.toFixed(4)}°, ${city.long.toFixed(4)}°`} monospace />
          )}
        </Popover.Dropdown>
      </Popover>
    </div>
    <DistanceSection lat={city.lat} long={city.long} />
  </>
);

export default AdditionalInfo;
