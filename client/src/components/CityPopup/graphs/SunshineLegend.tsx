import LegendSwatch from './legend/LegendSwatch';
import LegendDash from './legend/LegendDash';

interface SunshineLegendProps {
  mainColor: string;
  comparisonColor?: string | null;
}

const SunshineLegend = ({
  mainColor,
  comparisonColor,
}: SunshineLegendProps) => (
  <div
    className="flex flex-col gap-0.5 text-[9px] uppercase tracking-[0.08em]"
    style={{ color: 'var(--mantine-color-dimmed)' }}
  >
    <span className="flex items-center gap-1">
      <LegendSwatch color={mainColor} />
      {comparisonColor && <LegendSwatch color={comparisonColor} />}
      actual sun
    </span>
    <span className="flex items-center gap-1">
      <LegendDash color={mainColor} />
      {comparisonColor && <LegendDash color={comparisonColor} />}
      100% ceiling
    </span>
  </div>
);

export default SunshineLegend;
