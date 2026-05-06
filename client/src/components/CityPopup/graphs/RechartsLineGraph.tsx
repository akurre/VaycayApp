import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/types';

import { useChartColors } from '@/hooks/useChartColors';
import { CustomChartLegend } from './CustomChartLegend';
import type {
  ChartDataPoint,
  LineConfig,
  ReferenceLineConfig,
  RechartsLineGraphProps,
} from '@/types/chartTypes';

// Re-export types for backward compatibility
export type { ChartDataPoint, LineConfig, ReferenceLineConfig };

const RechartsLineGraphComponent = <T extends ChartDataPoint>({
  data,
  cityKey,
  xAxisDataKey,
  xAxisLabel,
  yAxisLabel,
  lines,
  referenceLines = [],
  tooltipContent,
  animationDuration = 800,
  animationEasing = 'ease-in-out',
  margin = { top: 5, right: 10, left: -20, bottom: 5 },
  showLegend = true,
  legendLayout = 'vertical',
  legendVerticalAlign = 'middle',
  legendAlign = 'right',
  onHover,
}: RechartsLineGraphProps<T>) => {
  // Get theme-aware colors
  const chartColors = useChartColors();

  // Use smooth morphing transition for all city changes
  const effectiveAnimationDuration = 300;

  const handleMouseMove: CategoricalChartFunc = (state) => {
    if (!onHover) return;
    const { activeLabel, activeTooltipIndex } = state;
    if (
      activeLabel === undefined ||
      activeTooltipIndex === undefined ||
      activeTooltipIndex === null ||
      typeof activeTooltipIndex === 'string'
    ) {
      onHover(null);
      return;
    }
    onHover({ activeLabel, activeIndex: activeTooltipIndex });
  };

  const handleMouseLeave = () => {
    if (onHover) onHover(null);
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={margin}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />

          {/* X Axis */}
          <XAxis
            dataKey={xAxisDataKey}
            tick={
              xAxisLabel
                ? { fontSize: 12, fill: chartColors.textColor }
                : false
            }
            stroke={chartColors.axisColor}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -5,
                    style: { fontSize: 12, fill: chartColors.textColor },
                  }
                : undefined
            }
          />

          {/* Y Axis — right-orientation by default; only show rotated title when yAxisLabel is provided */}
          <YAxis
            orientation="right"
            tick={{ fontSize: 12, fill: chartColors.textColor }}
            stroke={chartColors.axisColor}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideRight',
                    style: { fontSize: 12, fill: chartColors.textColor },
                  }
                : undefined
            }
          />

          {/* Tooltip */}
          {tooltipContent ? (
            <Tooltip
              content={tooltipContent}
              contentStyle={{
                backgroundColor: chartColors.backgroundColor,
                border: `1px solid ${chartColors.gridColor}`,
                borderRadius: '4px',
              }}
            />
          ) : (
            <Tooltip
              contentStyle={{
                fontSize: 12,
                backgroundColor: chartColors.backgroundColor,
                border: `1px solid ${chartColors.gridColor}`,
                borderRadius: '4px',
                color: chartColors.textColor,
              }}
            />
          )}

          {/* Legend */}
          {showLegend && (
            <Legend
              content={CustomChartLegend}
              wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
              layout={legendLayout}
              verticalAlign={legendVerticalAlign}
              align={legendAlign}
              height={legendLayout === 'vertical' ? 24 : undefined}
            />
          )}

          {/* Reference Lines */}
          {referenceLines.map((refLine) => (
            <ReferenceLine
              key={`ref-${refLine.x ?? ''}-${refLine.y ?? ''}-${refLine.label ?? ''}`}
              x={refLine.x}
              y={refLine.y}
              stroke={refLine.stroke}
              strokeWidth={refLine.strokeWidth}
              strokeDasharray={refLine.strokeDasharray}
              label={refLine.label}
            />
          ))}

          {/* Data Lines */}
          {lines.map((lineConfig) => (
            <Line
              key={lineConfig.dataKey}
              type="monotone"
              dataKey={lineConfig.dataKey}
              name={lineConfig.name}
              stroke={lineConfig.stroke}
              strokeWidth={lineConfig.strokeWidth ?? 2}
              strokeDasharray={lineConfig.strokeDasharray}
              dot={lineConfig.dot ?? false}
              connectNulls={lineConfig.connectNulls ?? true}
              isAnimationActive={true}
              animationDuration={effectiveAnimationDuration}
              animationEasing={animationEasing}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export with memo for performance optimization
const RechartsLineGraph = memo(
  RechartsLineGraphComponent
) as typeof RechartsLineGraphComponent;
export default RechartsLineGraph;
