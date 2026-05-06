import { useMemo, memo, useCallback } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { ChartHoverState } from '@/types/chartTypes';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import RechartsLineGraph, {
  type LineConfig,
  type AreaConfig,
  type ReferenceLineConfig,
} from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData | null;
  selectedMonth?: number;
  comparisonSunshineData?: SunshineData | null;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const SunshineLegend = () => (
  <div
    className="flex gap-3 text-[9px] uppercase tracking-[0.08em]"
    style={{ color: 'var(--mantine-color-dimmed)' }}
  >
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-3"
        style={{ height: 2, background: CITY1_PRIMARY_COLOR }}
      />
      actual sun
    </span>
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-3 border-t border-dashed"
        style={{ borderColor: CITY1_PRIMARY_COLOR, height: 0 }}
      />
      100% ceiling
    </span>
  </div>
);

const SunshineGraph = ({
  sunshineData,
  selectedMonth,
  comparisonSunshineData,
  onHover,
}: SunshineGraphProps) => {
  const chartColors = useChartColors();

  const chartData = useMemo(
    () => (sunshineData ? transformSunshineDataForChart(sunshineData) : null),
    [sunshineData]
  );
  const comparisonChartData = useMemo(
    () =>
      comparisonSunshineData
        ? transformSunshineDataForChart(comparisonSunshineData)
        : null,
    [comparisonSunshineData]
  );

  const baseData = sunshineData ?? comparisonSunshineData;
  const mainLat = sunshineData?.lat ?? null;
  const compLat = comparisonSunshineData?.lat ?? null;

  const theoreticalMax = useMemo(
    () => (mainLat === null ? null : generateTheoreticalMaxSunshineData(mainLat)),
    [mainLat]
  );
  const compTheoreticalMax = useMemo(
    () => (compLat === null ? null : generateTheoreticalMaxSunshineData(compLat)),
    [compLat]
  );

  const baseStructure = chartData ?? comparisonChartData;

  const combined = useMemo(
    () =>
      baseStructure
        ? baseStructure.map((point, index) => ({
            ...point,
            hours: chartData ? chartData[index]?.hours : null,
            theoreticalMax: theoreticalMax ? theoreticalMax[index] : null,
            comparisonTheoreticalMax: compTheoreticalMax
              ? compTheoreticalMax[index]
              : null,
            comparisonHours: comparisonChartData
              ? comparisonChartData[index]?.hours
              : null,
          }))
        : [],
    [
      baseStructure,
      chartData,
      theoreticalMax,
      compTheoreticalMax,
      comparisonChartData,
    ]
  );

  // Filled areas for actual sun
  const areas: AreaConfig[] = useMemo(() => {
    const list: AreaConfig[] = [];
    if (sunshineData) {
      list.push({
        dataKey: 'hours',
        fill: CITY1_PRIMARY_COLOR,
        fillOpacity: 0.28,
      });
    }
    if (comparisonSunshineData) {
      list.push({
        dataKey: 'comparisonHours',
        fill: sunshineData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR,
        fillOpacity: 0.24,
      });
    }
    return list;
  }, [sunshineData, comparisonSunshineData]);

  // Lines: the dashed ceilings, then the solid actual on top
  const lines: LineConfig[] = useMemo(() => {
    const list: LineConfig[] = [];
    if (theoreticalMax) {
      list.push({
        dataKey: 'theoreticalMax',
        name: '100% ceiling',
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 1.2,
        strokeDasharray: '4 3',
        dot: false,
      });
    }
    if (compTheoreticalMax) {
      list.push({
        dataKey: 'comparisonTheoreticalMax',
        name: 'comparison ceiling',
        stroke: sunshineData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR,
        strokeWidth: 1.2,
        strokeDasharray: '4 3',
        dot: false,
      });
    }
    if (sunshineData) {
      list.push({
        dataKey: 'hours',
        name: sunshineData.city ?? '',
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
        cityRole: 'main',
      });
    }
    if (comparisonSunshineData) {
      list.push({
        dataKey: 'comparisonHours',
        name: comparisonSunshineData.city ?? '',
        stroke: sunshineData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        dot: false,
        connectNulls: true,
        cityRole: 'comparison',
      });
    }
    return list;
  }, [theoreticalMax, compTheoreticalMax, sunshineData, comparisonSunshineData]);

  const referenceLines: ReferenceLineConfig[] = useMemo(() => {
    if (!selectedMonth) return [];
    return [
      {
        x: combined[selectedMonth - 1]?.month,
        stroke: chartColors.lineColor,
        strokeWidth: 1,
        strokeDasharray: '2 2',
      },
    ];
  }, [selectedMonth, combined, chartColors]);

  const handleHover = useCallback(
    (state: ChartHoverState | null) => {
      if (!onHover) return;
      if (!state) {
        onHover(null);
        return;
      }
      const point = combined[state.activeIndex];
      if (!point) {
        onHover(null);
        return;
      }
      const c1 = (point.hours ?? null) as number | null;
      const c2 = (point.comparisonHours ?? null) as number | null;
      onHover({
        label: typeof point.month === 'string' ? point.month : `${point.month}`,
        v1: c1 === null ? null : `${c1.toFixed(1)}h`,
        v2: c2 === null ? null : `${c2.toFixed(1)}h`,
      });
    },
    [combined, onHover]
  );

  if (!baseData || !baseStructure) return null;

  const cityKey = `${baseData.city}-${baseData.lat}-${baseData.long}`;

  return (
    <RechartsLineGraph
      data={combined}
      cityKey={cityKey}
      xAxisDataKey="month"
      lines={lines}
      areas={areas}
      referenceLines={referenceLines}
      showLegend={false}
      yTickFormatter={(v) => `${v}h`}
      overlay={<SunshineLegend />}
      onHover={handleHover}
    />
  );
};

export default memo(SunshineGraph);
