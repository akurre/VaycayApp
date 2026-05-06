import { useCallback, useState, type ReactNode } from 'react';
import type { RibbonHoverPayload, RibbonStat } from '@/types/cityPopupTypes';
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
  todayC1: number | null;
  todayC2: number | null;
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
  todayC1,
  todayC2,
  selectedDate,
  stats,
  comparisonNode,
  renderChart,
}: RibbonShellProps) => {
  const [tab, setTab] = useState<DataType>(initialTab);
  const [hover, setHover] = useState<RibbonHoverPayload | null>(null);

  const hasComparison = !!comparisonCity;

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
