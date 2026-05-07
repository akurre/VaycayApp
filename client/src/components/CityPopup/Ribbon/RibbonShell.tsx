import { useCallback, useState, type ReactNode } from 'react';
import type {
  RibbonHoverPayload,
  RibbonStat,
  TodayValuesByTab,
} from '@/types/cityPopupTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { DataType } from '@/types/mapTypes';
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
  availableTabs?: ReadonlyArray<DataType>;
  notesByTab?: Partial<Record<DataType, ReactNode>>;
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
  availableTabs,
  notesByTab,
  renderChart,
}: RibbonShellProps) => {
  const [tab, setTab] = useState<DataType>(initialTab);
  const [hover, setHover] = useState<RibbonHoverPayload | null>(null);

  // If the user's intent tab disappeared (e.g. comparison city removed and it
  // was the only city with sunshine), fall back to the first available tab.
  // The intent stays in `tab` so it returns when the data comes back.
  const visibleTab =
    availableTabs && !availableTabs.includes(tab)
      ? (availableTabs[0] ?? DataType.Temperature)
      : tab;

  const hasComparison = !!comparisonCity;
  const {
    c1: todayC1,
    c2: todayC2,
    subC1: todaySubC1,
    subC2: todaySubC2,
  } = todayValuesByTab[visibleTab];

  const footerNote = notesByTab?.[visibleTab] ?? null;

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
            tab={visibleTab}
            c1Value={todayC1}
            c2Value={todayC2}
            subC1Value={todaySubC1 ?? null}
            subC2Value={todaySubC2 ?? null}
            hasComparison={hasComparison}
            selectedDate={selectedDate}
            hover={hover}
          />
        </header>

        <main className="flex-1 min-h-0">
          {renderChart(visibleTab, handleHover)}
        </main>

        <MonthLabels />

        <footer className="mt-2 flex items-center justify-between gap-3">
          <IconTabs
            tab={visibleTab}
            onTab={setTab}
            availableTabs={availableTabs}
          />
          {footerNote}
        </footer>
      </div>

      <StatStack stats={stats} hasComparison={hasComparison} />
    </div>
  );
};

export default RibbonShell;
