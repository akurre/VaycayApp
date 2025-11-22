import type { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import DistanceSection from './DistanceSection';
import GreaterSection from './GreaterSection';

interface AdditionalInfoProps {
  city: WeatherDataUnion;
}

const AdditionalInfo = ({ city }: AdditionalInfoProps) => (
  <GreaterSection title="City Info">
    <div className="flex justify-between mb-3">
      {city.population && (
        <div>
          <Field label="Population" value={city.population.toLocaleString()} />
        </div>
      )}
    </div>
    <DistanceSection lat={city.lat} long={city.long} />
  </GreaterSection>
);

export default AdditionalInfo;
