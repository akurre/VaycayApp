// Custom legend renderer that properly shows dashed lines for chart components
interface CustomLegendPayload {
  value?: string;
  type?: string;
  id?: string;
  color?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
}

interface CustomLegendProps {
  payload?: readonly CustomLegendPayload[];
}

export const CustomChartLegend = (props: CustomLegendProps) => {
  const { payload } = props;
  if (!payload) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '12px',
        paddingLeft: '13px',
      }}
    >
      {payload.map((entry) => {
        const isDashed = entry.payload?.strokeDasharray;
        const displayValue = entry.value ?? '';
        return (
          <div
            key={`legend-${entry.id ?? displayValue}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="20" height="2" style={{ overflow: 'visible' }}>
              <line
                x1="0"
                y1="1"
                x2="20"
                y2="1"
                stroke={entry.color}
                strokeWidth="2"
                strokeDasharray={isDashed ? '3 3' : undefined}
              />
            </svg>
            <span style={{ color: entry.color }}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};
