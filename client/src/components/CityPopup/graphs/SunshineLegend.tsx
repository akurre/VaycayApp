interface SunshineLegendProps {
  mainColor: string;
  comparisonColor?: string | null;
}

const Swatch = ({ color }: { color: string }) => (
  <span className="inline-block w-3" style={{ height: 2, background: color }} />
);

const Dash = ({ color }: { color: string }) => (
  <span
    className="inline-block w-3 border-t border-dashed"
    style={{ borderColor: color, height: 0 }}
  />
);

const SunshineLegend = ({
  mainColor,
  comparisonColor,
}: SunshineLegendProps) => (
  <div
    className="flex flex-col gap-0.5 text-[9px] uppercase tracking-[0.08em]"
    style={{ color: 'var(--mantine-color-dimmed)' }}
  >
    <span className="flex items-center gap-1">
      <Swatch color={mainColor} />
      {comparisonColor && <Swatch color={comparisonColor} />}
      actual sun
    </span>
    <span className="flex items-center gap-1">
      <Dash color={mainColor} />
      {comparisonColor && <Dash color={comparisonColor} />}
      100% ceiling
    </span>
  </div>
);

export default SunshineLegend;
