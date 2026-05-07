import type { ReactNode } from 'react';
import { CITY1_PRIMARY_COLOR } from '@/const';
import CityNameRow from './CityNameRow';

interface CityNamesHeaderProps {
  baseCityName: string;
  baseCityLat: number | null;
  comparisonNode?: ReactNode;
}

const CityNamesHeader = ({
  baseCityName,
  baseCityLat,
  comparisonNode,
}: CityNamesHeaderProps) => {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <CityNameRow
        color={CITY1_PRIMARY_COLOR}
        name={baseCityName}
        lat={baseCityLat}
      />
      {comparisonNode}
    </div>
  );
};

export default CityNamesHeader;
