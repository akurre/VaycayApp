import { useCallback, useState, type ReactNode } from 'react';
import type {
  RibbonHoverPayload,
  RibbonStat,
  TodayValuesByTab,
} from '@/types/cityPopupTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';
import type { DataType } from '@/types/mapTypes';
import { RIBBON_HEADER_RIGHT_RESERVE_PX } from '@/const';
import CityNamesHeader from './CityNamesHeader';
import TodayReadout from './TodayReadout';
import IconTabs from './IconTabs';
import MonthLabels from './MonthLabels';
import StatStack from './StatStack';

interface RibbonShellProps {
  baseCityName: string;
  baseCityLat: number | null;
  comparisonCity: SearchCitiesResult | null;
  initialTab: DataType;
  todayValuesByTab: TodayValuesByTab;
  selectedDate: string;
  stats: ReadonlyArray<RibbonStat>;
  comparisonNode?: ReactNode;
  renderChart: (
    tab: DataType,
    onHover: (payload: RibbonHoverPayload | null) => void
  ) => ReactNode;
}

const RibbonShell = ({
  baseCityName,
  baseCityLat,
  comparisonCity,
  initialTab,
  todayValuesByTab,
  selectedDate,
  stats,
  comparisonNode,
  renderChart,
}: RibbonShellProps) => {
  const [tab, setTab] = useState<DataType>(initialTab);
  const [hover, setHover] = useState<RibbonHoverPayload | null>(null);

  const hasComparison = !!comparisonCity;
  const {
    c1: todayC1,
    c2: todayC2,
    subC1: todaySubC1,
    subC2: todaySubC2,
  } = todayValuesByTab[tab];

  const handleHover = useCallback((payload: RibbonHoverPayload | null) => {
    setHover(payload);
  }, []);

  return (
    <div className="flex h-full py-3 pl-4 pr-4 gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="flex items-start justify-between gap-6 mb-2.5"
          style={{ paddingRight: RIBBON_HEADER_RIGHT_RESERVE_PX }}
        >
          <CityNamesHeader
            baseCityName={baseCityName}
            baseCityLat={baseCityLat}
            comparisonNode={comparisonNode}
          />
          <TodayReadout
            tab={tab}
            c1Value={todayC1}
            c2Value={todayC2}
            subC1Value={todaySubC1 ?? null}
            subC2Value={todaySubC2 ?? null}
            hasComparison={hasComparison}
            selectedDate={selectedDate}
            hover={hover}
          />
        </header>

        <main className="flex-1 min-h-0">{renderChart(tab, handleHover)}</main>

        <MonthLabels />

        <footer className="mt-2">
          <IconTabs tab={tab} onTab={setTab} />
        </footer>
      </div>

      <StatStack stats={stats} hasComparison={hasComparison} />
    </div>
  );
};

export default RibbonShell;
