import { CITY1_PRIMARY_COLOR } from '@/const';

const SunshineLegend = () => (
  <div
    className="flex flex-col gap-0.5 text-[9px] uppercase tracking-[0.08em]"
    style={{ color: 'var(--mantine-color-dimmed)' }}
  >
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-3"
        style={{ height: 2, background: CITY1_PRIMARY_COLOR }}
      />
      actual sun
    </span>
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-3 border-t border-dashed"
        style={{ borderColor: CITY1_PRIMARY_COLOR, height: 0 }}
      />
      100% ceiling
    </span>
  </div>
);

export default SunshineLegend;
