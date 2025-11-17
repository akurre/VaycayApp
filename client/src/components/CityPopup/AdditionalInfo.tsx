import React from 'react';
import { Divider } from '@mantine/core';
import { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import LocationSection from './LocationSection';
import DistanceSection from './DistanceSection';

interface AdditionalInfoProps {
  city: WeatherDataUnion;
}

const AdditionalInfo = ({ city }: AdditionalInfoProps) => (
  <>
    {city.population && (
      <div>
        <Divider />
        <Field label="Population" value={city.population.toLocaleString()} />
      </div>
    )}
    {city.stationName && (
      <div>
        <Divider />
        <Field label="Weather Station" value={city.stationName} />
      </div>
    )}
    <LocationSection lat={city.lat} long={city.long} />
    <DistanceSection lat={city.lat} long={city.long} />
  </>
);

export default AdditionalInfo;
