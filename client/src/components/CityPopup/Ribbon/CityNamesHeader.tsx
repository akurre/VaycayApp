import type { ReactNode } from 'react';
import { CITY1_PRIMARY_COLOR } from '@/const';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';
import LatBadge from './LatBadge';

interface CityNamesHeaderProps {
  baseCityName: string;
  baseCityLat: number | null;
  comparisonNode?: ReactNode;
}

interface RowProps {
  color: string;
  name: string;
  lat: number | null;
}

const Row = ({ color, name, lat }: RowProps) => {
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

const CityNamesHeader = ({
  baseCityName,
  baseCityLat,
  comparisonNode,
}: CityNamesHeaderProps) => {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row color={CITY1_PRIMARY_COLOR} name={baseCityName} lat={baseCityLat} />
      {comparisonNode}
    </div>
  );
};

export default CityNamesHeader;
