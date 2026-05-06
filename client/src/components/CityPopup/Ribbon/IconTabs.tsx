import type { ReactNode } from 'react';
import { IconDroplet, IconSun, IconTemperature } from '@tabler/icons-react';
import { DataType } from '@/types/mapTypes';
import { CITY1_PRIMARY_COLOR } from '@/const';

interface IconTabsProps {
  tab: DataType;
  onTab: (next: DataType) => void;
}

interface TabItem {
  id: DataType;
  label: string;
  icon: ReactNode;
}

const TABS: ReadonlyArray<TabItem> = [
  { id: DataType.Temperature, label: 'Temp', icon: <IconTemperature size={16} /> },
  { id: DataType.Sunshine, label: 'Sun', icon: <IconSun size={16} /> },
  { id: DataType.Precip, label: 'Precip', icon: <IconDroplet size={16} /> },
];

const IconTabs = ({ tab, onTab }: IconTabsProps) => {
  return (
    <div className="flex gap-1">
      {TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={active}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold tracking-wide cursor-pointer transition-all"
            style={{
              background: active ? 'var(--mantine-color-default-hover)' : 'transparent',
              border: `1px solid ${active ? CITY1_PRIMARY_COLOR : 'var(--mantine-color-default-border)'}`,
              color: active ? CITY1_PRIMARY_COLOR : 'var(--mantine-color-dimmed)',
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default IconTabs;
