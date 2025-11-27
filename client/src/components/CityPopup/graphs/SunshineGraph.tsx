import { useMemo, memo, useCallback } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import SunshineGraphTooltip from './SunshineGraphTooltip';
import SunshineGraphDot from './SunshineGraphDot';
import RechartsLineGraph, { type LineConfig, type ReferenceLineConfig } from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface SunshineGraphProps {
  sunshineData: SunshineData;
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

  // Generate unique city key for animation control
  const cityKey = `${sunshineData.city}-${sunshineData.lat}-${sunshineData.long}`;

  // Transform sunshine data for chart
  const chartData = useMemo(() => transformSunshineDataForChart(sunshineData), [sunshineData]);

  // Transform comparison sunshine data if available
  const comparisonChartData = useMemo(
    () => (comparisonSunshineData ? transformSunshineDataForChart(comparisonSunshineData) : null),
    [comparisonSunshineData]
  );

  // Calculate theoretical maximum sunshine based on latitude (memoized per city)
  const latitude = sunshineData.lat;
  const theoreticalMaxData = useMemo(
    () => (latitude === null ? null : generateTheoreticalMaxSunshineData(latitude)),
    [latitude]
  );

  // Combine actual data with theoretical max and comparison data for chart (memoized)
  const combinedChartData = useMemo(
    () =>
      chartData.map((point, index) => ({
        ...point,
        theoreticalMax: theoreticalMaxData ? theoreticalMaxData[index] : null,
        baseline: 0, // 0% sunshine baseline
        comparisonHours: comparisonChartData ? comparisonChartData[index]?.hours : null,
      })),
    [chartData, theoreticalMaxData, comparisonChartData]
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
    const mainCityName = sunshineData.city;
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

    // Add actual sunshine line - City 1 (blue)
    lineConfigs.push({
      dataKey: 'hours',
      name: comparisonSunshineData ? `${mainCityName}` : 'Actual',
      stroke: CITY1_PRIMARY_COLOR,
      strokeWidth: 2,
      dot: renderCustomDot,
      connectNulls: true,
    });

    // Add comparison city sunshine line if data exists - City 2 (purple)
    if (comparisonSunshineData) {
      lineConfigs.push({
        dataKey: 'comparisonHours',
        name: `${compCityName}`,
        stroke: CITY2_PRIMARY_COLOR,
        strokeWidth: 2,
        strokeDasharray: '5 5',
        dot: false,
        connectNulls: true,
      });
    }

    return lineConfigs;
  }, [theoreticalMaxData, renderCustomDot, chartColors, sunshineData.city, comparisonSunshineData]);

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
