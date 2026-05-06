import type { ReactNode } from 'react';
import { CITY1_PRIMARY_COLOR } from '@/const';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';

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
  const latLabel = lat === null ? null : getClimateZoneFromLat(lat).latLabel;

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
      {latLabel && (
        <span className="text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] text-[var(--mantine-color-dimmed)] shrink-0">
          {latLabel}
        </span>
      )}
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
