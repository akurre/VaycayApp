import { useMemo, memo, useCallback } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import type { ChartHoverState } from '@/types/chartTypes';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import { formatSunshinePercentage } from '@/utils/dataFormatting/formatSunshinePercentage';
import RechartsLineGraph, {
  type LineConfig,
  type AreaConfig,
  type ReferenceLineConfig,
} from './RechartsLineGraph';
import SunshineLegend from './SunshineLegend';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData | null;
  selectedMonth?: number;
  comparisonSunshineData?: SunshineData | null;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const SunshineGraph = ({
  sunshineData,
  selectedMonth,
  comparisonSunshineData,
  onHover,
}: SunshineGraphProps) => {
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
    () =>
      mainLat === null ? null : generateTheoreticalMaxSunshineData(mainLat),
    [mainLat]
  );
  const compTheoreticalMax = useMemo(
    () =>
      compLat === null ? null : generateTheoreticalMaxSunshineData(compLat),
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
  }, [
    theoreticalMax,
    compTheoreticalMax,
    sunshineData,
    comparisonSunshineData,
  ]);

  const referenceLines: ReferenceLineConfig[] = useMemo(() => {
    if (!selectedMonth) return [];
    const x = combined[selectedMonth - 1]?.month;
    if (typeof x !== 'string' && typeof x !== 'number') return [];
    return [
      {
        x,
        stroke: 'var(--mantine-color-dimmed)',
        strokeWidth: 1,
        strokeDasharray: '3 3',
      },
    ];
  }, [selectedMonth, combined]);

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
      const c1 = point.hours ?? null;
      const c2 = point.comparisonHours ?? null;
      const max1 = point.theoreticalMax ?? null;
      const max2 = point.comparisonTheoreticalMax ?? null;
      onHover({
        label: point.month,
        v1: c1 === null ? null : `${c1.toFixed(1)}h`,
        v2: c2 === null ? null : `${c2.toFixed(1)}h`,
        subV1: formatSunshinePercentage(c1, max1),
        subV2: formatSunshinePercentage(c2, max2),
      });
    },
    [combined, onHover]
  );

  const renderTooltipExtras = useCallback(
    (row: (typeof combined)[number]) => {
      const c1 = row.hours ?? null;
      const c2 = row.comparisonHours ?? null;
      const max1 = row.theoreticalMax ?? null;
      const max2 = row.comparisonTheoreticalMax ?? null;
      const sub1 = formatSunshinePercentage(c1, max1);
      const sub2 = formatSunshinePercentage(c2, max2);
      if (!sub1 && !sub2) return null;
      const hasComp = !!comparisonSunshineData;
      return (
        <div className="flex justify-end gap-3 text-[10px] font-semibold">
          {sub1 && <span style={{ color: CITY1_PRIMARY_COLOR }}>{sub1}</span>}
          {hasComp && sub2 && (
            <span
              style={{
                color: sunshineData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR,
              }}
            >
              {sub2}
            </span>
          )}
        </div>
      );
    },
    [sunshineData, comparisonSunshineData]
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
      yAxisOrientation="left"
      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      overlay={<SunshineLegend />}
      onHover={handleHover}
      renderTooltipExtras={renderTooltipExtras}
    />
  );
};

export default memo(SunshineGraph);
