import { useMemo, memo, useCallback } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import SunshineGraphTooltip from './SunshineGraphTooltip';
import SunshineGraphDot from './SunshineGraphDot';
import RechartsLineGraph, {
  type LineConfig,
  type ReferenceLineConfig,
} from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData | null;
  selectedMonth?: number;
  comparisonSunshineData?: SunshineData | null;
}

const SunshineGraph = ({
  sunshineData,
  selectedMonth,
  comparisonSunshineData,
}: SunshineGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Transform sunshine data for chart
  const chartData = useMemo(
    () => (sunshineData ? transformSunshineDataForChart(sunshineData) : null),
    [sunshineData]
  );

  // Transform comparison sunshine data if available
  const comparisonChartData = useMemo(
    () =>
      comparisonSunshineData
        ? transformSunshineDataForChart(comparisonSunshineData)
        : null,
    [comparisonSunshineData]
  );

  // use whichever data is available for the base chart structure
  const baseData = sunshineData ?? comparisonSunshineData;

  // Calculate theoretical maximum sunshine based on latitude (memoized per city)
  const latitude = baseData?.lat ?? null;
  const theoreticalMaxData = useMemo(
    () =>
      latitude === null ? null : generateTheoreticalMaxSunshineData(latitude),
    [latitude]
  );

  // use base chart structure from whichever city has data
  const baseChartStructure = chartData ?? comparisonChartData;

  // Combine actual data with theoretical max and comparison data for chart (memoized)
  const combinedChartData = useMemo(
    () =>
      baseChartStructure
        ? baseChartStructure.map((point, index) => ({
            ...point,
            hours: chartData ? chartData[index]?.hours : null,
            theoreticalMax: theoreticalMaxData ? theoreticalMaxData[index] : null,
            baseline: 0, // 0% sunshine baseline
            comparisonHours: comparisonChartData
              ? comparisonChartData[index]?.hours
              : null,
          }))
        : [],
    [baseChartStructure, chartData, theoreticalMaxData, comparisonChartData]
  );

  // Memoize custom dot render function
  const renderCustomDot = useCallback(
    (props: Record<string, unknown>) => (
      <SunshineGraphDot {...props} selectedMonth={selectedMonth} />
    ),
    [selectedMonth]
  );

  // Configure lines
  const lines: LineConfig[] = useMemo(() => {
    const mainCityName = sunshineData?.city;
    const compCityName = comparisonSunshineData?.city;
    const lineConfigs: LineConfig[] = [];

    // Add theoretical maximum line if data exists
    if (theoreticalMaxData) {
      lineConfigs.push({
        dataKey: 'theoreticalMax',
        name: '100% Sun',
        stroke: chartColors.maxLineColor,
        strokeWidth: 1.5,
        strokeDasharray: '5 5',
        dot: false,
      });
    }

    // Add actual sunshine line - City 1 (blue) - only if base city has data
    if (sunshineData) {
      lineConfigs.push({
        dataKey: 'hours',
        name: comparisonSunshineData ? `${mainCityName}` : 'Actual',
        stroke: CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        dot: renderCustomDot,
        connectNulls: true,
      });
    }

    // Add comparison city sunshine line if data exists - City 2 (purple)
    if (comparisonSunshineData) {
      lineConfigs.push({
        dataKey: 'comparisonHours',
        name: `${compCityName}`,
        stroke: sunshineData ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR,
        strokeWidth: 2,
        strokeDasharray: sunshineData ? '5 5' : undefined,
        dot: sunshineData ? false : renderCustomDot,
        connectNulls: true,
      });
    }

    return lineConfigs;
  }, [
    theoreticalMaxData,
    renderCustomDot,
    chartColors,
    sunshineData,
    comparisonSunshineData,
  ]);

  // Configure reference line for selected month
  const referenceLines: ReferenceLineConfig[] = useMemo(() => {
    if (!selectedMonth) return [];

    return [
      {
        x: combinedChartData[selectedMonth - 1]?.month,
        stroke: chartColors.lineColor,
        strokeWidth: 2,
        strokeDasharray: '5 5',
      },
    ];
  }, [selectedMonth, combinedChartData, chartColors]);

  // if neither city has data, return null (shouldn't happen due to WeatherDataSection check)
  if (!baseData || !baseChartStructure) return null;

  // Generate unique city key for animation control
  const cityKey = `${baseData.city}-${baseData.lat}-${baseData.long}`;

  return (
    <RechartsLineGraph
      data={combinedChartData}
      cityKey={cityKey}
      xAxisDataKey="month"
      yAxisLabel="Hours"
      lines={lines}
      legendLayout="horizontal"
      legendVerticalAlign="top"
      legendAlign="center"
      referenceLines={referenceLines}
      tooltipContent={<SunshineGraphTooltip />}
      margin={{ left: 0 }}
    />
  );
};

export default memo(SunshineGraph);
