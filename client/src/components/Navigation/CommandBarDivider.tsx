interface CommandBarDividerProps {
  color: string;
}

const CommandBarDivider = ({ color }: CommandBarDividerProps) => (
  <div className="w-px h-7" style={{ background: color }} />
);

export default CommandBarDivider;
