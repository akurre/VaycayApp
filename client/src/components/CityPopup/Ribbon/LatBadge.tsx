interface LatBadgeProps {
  label: string;
}

const LatBadge = ({ label }: LatBadgeProps) => (
  <span className="text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] text-[var(--mantine-color-dimmed)] shrink-0">
    {label}
  </span>
);

export default LatBadge;
