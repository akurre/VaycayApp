import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';
import LatBadge from './LatBadge';

interface CityNameRowProps {
  color: string;
  name: string;
  lat: number | null;
}

const CityNameRow = ({ color, name, lat }: CityNameRowProps) => {
  const latLabel = lat === null ? null : getClimateZoneFromLat(lat);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      <h2
        className="text-[17px] font-bold font-[Outfit] text-[var(--mantine-color-text)] truncate min-w-0"
        title={name}
      >
        {name}
      </h2>
      {latLabel && <LatBadge label={latLabel} />}
    </div>
  );
};

export default CityNameRow;
