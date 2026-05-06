import { useCallback, useState, type ReactNode } from 'react';
import type {
  RibbonHoverPayload,
  RibbonStat,
} from '@/types/cityPopupTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { DataType } from '@/types/mapTypes';
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

  // Today readout values per active tab. Parent computes per-tab (temp/sun/precip).
  todayC1: number | null;
  todayC2: number | null;
  selectedDate: string;

  // Stat rail
  stats: ReadonlyArray<RibbonStat>;

  // Chart panel — caller renders the active graph and forwards onHover up
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
  renderChart,
}: RibbonShellProps) => {
  const [tab, setTab] = useState<DataType>(initialTab);
  const [hover, setHover] = useState<RibbonHoverPayload | null>(null);

  const hasComparison = !!comparisonCity;

  // Stable identity so the memoized chart panel doesn't re-render on hover churn
  const handleHover = useCallback((payload: RibbonHoverPayload | null) => {
    setHover(payload);
  }, []);

  return (
    <div className="flex h-full py-3 px-6 gap-4">
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-start justify-between gap-6 mb-2.5">
          <CityNamesHeader
            baseCityName={baseCityName}
            baseCityLat={baseCityLat}
            comparisonCity={comparisonCity}
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
