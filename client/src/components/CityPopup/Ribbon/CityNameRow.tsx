import type { ReactNode } from 'react';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';
import LatBadge from './LatBadge';

interface CityNameRowProps {
  color: string;
  name: string;
  lat: number | null;
  onClick?: () => void;
  actions?: ReactNode;
}

const CityNameRow = ({
  color,
  name,
  lat,
  onClick,
  actions,
}: CityNameRowProps) => {
  const latLabel = lat === null ? null : getClimateZoneFromLat(lat);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {/* plain h2 instead of Mantine Title — Mantine's text truncation conflicts with flex min-w-0 */}
      <h2
        className={`text-[17px] font-bold font-[Outfit_Variable] text-[var(--mantine-color-text)] truncate min-w-0${onClick ? ' cursor-pointer hover:opacity-80' : ''}`}
        title={name}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
              }
            : undefined
        }
      >
        {name}
      </h2>
      {latLabel && <LatBadge label={latLabel} />}
      {actions}
    </div>
  );
};

export default CityNameRow;
