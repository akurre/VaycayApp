import Field from './Field';
import Divider from './Divider';

interface LocationSectionProps {
  lat: number | null;
  long: number | null;
}

const LocationSection = ({ lat, long }: LocationSectionProps) => {
  if (lat === null || long === null) return null;

  return (
    <div>
      <Divider />
      <Field label="Coordinates" value={`${lat.toFixed(4)}°, ${long.toFixed(4)}°`} monospace />
    </div>
  );
};

export default LocationSection;
