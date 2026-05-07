interface LegendDashProps {
  color: string;
}

const LegendDash = ({ color }: LegendDashProps) => (
  <span
    className="inline-block w-3 border-t border-dashed"
    style={{ borderColor: color, height: 0 }}
  />
);

export default LegendDash;
