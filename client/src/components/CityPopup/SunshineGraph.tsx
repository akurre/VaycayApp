import { useMemo, memo, useCallback } from 'react';
import type { SunshineData } from '@/types/sunshineDataType';
import { transformSunshineDataForChart } from '@/utils/dataFormatting/transformSunshineDataForChart';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import SunshineGraphTooltip from './SunshineGraphTooltip';
import SunshineGraphDot from './SunshineGraphDot';
import RechartsLineGraph, { type LineConfig, type ReferenceLineConfig } from './RechartsLineGraph';
import { useChartColors } from '@/hooks/useChartColors';

interface SunshineGraphProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

const SunshineGraph = ({ sunshineData, selectedMonth }: SunshineGraphProps) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Generate unique city key for animation control
  const cityKey = `${sunshineData.city}-${sunshineData.lat}-${sunshineData.long}`;

  // Transform sunshine data for chart
  const chartData = useMemo(() => transformSunshineDataForChart(sunshineData), [sunshineData]);

  // Calculate theoretical maximum sunshine based on latitude (memoized per city)
  const latitude = sunshineData.lat;
  const theoreticalMaxData = useMemo(
    () => (latitude === null ? null : generateTheoreticalMaxSunshineData(latitude)),
    [latitude]
  );

  // Combine actual data with theoretical max for chart (memoized)
  const combinedChartData = useMemo(
    () =>
      chartData.map((point, index) => ({
        ...point,
        theoreticalMax: theoreticalMaxData ? theoreticalMaxData[index] : null,
        baseline: 0, // 0% sunshine baseline
      })),
    [chartData, theoreticalMaxData]
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

    // Add actual sunshine line
    lineConfigs.push({
      dataKey: 'hours',
      name: 'Actual',
      stroke: chartColors.lineColor,
      strokeWidth: 2,
      dot: renderCustomDot,
      connectNulls: true,
    });

    return lineConfigs;
  }, [theoreticalMaxData, renderCustomDot, chartColors]);

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
      referenceLines={referenceLines}
      tooltipContent={<SunshineGraphTooltip />}
    />
  );
};

export default memo(SunshineGraph);
