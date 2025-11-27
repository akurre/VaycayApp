import type { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import DistanceSection from './DistanceSection';
import GreaterSection from './GreaterSection';
import { Paper } from '@mantine/core';

interface AdditionalInfoProps {
  city: WeatherDataUnion;
}

const AdditionalInfo = ({ city }: AdditionalInfoProps) => (
  <Paper shadow="sm" p="xl" withBorder>
    <GreaterSection title="City Info">
      <div className="flex justify-between mb-3">
        {city.population && <Field label="Population" value={city.population.toLocaleString()} />}
      </div>
      <DistanceSection lat={city.lat} long={city.long} />
    </GreaterSection>
  </Paper>
);

export default AdditionalInfo;
