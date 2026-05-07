interface LegendSwatchProps {
  color: string;
}

const LegendSwatch = ({ color }: LegendSwatchProps) => (
  <span className="inline-block w-3" style={{ height: 2, background: color }} />
);

export default LegendSwatch;
