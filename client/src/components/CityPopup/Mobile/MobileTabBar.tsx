import type { ReactNode } from 'react';
import {
  IconDroplet,
  IconLayoutList,
  IconSun,
  IconTemperature,
} from '@tabler/icons-react';
import { MobileTab } from '@/types/mobileTabType';
import {
  CITY1_PRIMARY_COLOR,
  MOBILE_DRAWER_TAB_BAR_PX,
  TOGGLE_ICON_SIZE,
} from '@/const';

interface MobileTabBarProps {
  tab: MobileTab;
  onTab: (next: MobileTab) => void;
  availableTabs?: ReadonlyArray<MobileTab>;
}

interface TabItem {
  id: MobileTab;
  label: string;
  icon: ReactNode;
}

const TABS: ReadonlyArray<TabItem> = [
  {
    id: MobileTab.Temperature,
    label: 'Temp',
    icon: <IconTemperature size={TOGGLE_ICON_SIZE} />,
  },
  {
    id: MobileTab.Sunshine,
    label: 'Sun',
    icon: <IconSun size={TOGGLE_ICON_SIZE} />,
  },
  {
    id: MobileTab.Precip,
    label: 'Precip',
    icon: <IconDroplet size={TOGGLE_ICON_SIZE} />,
  },
  {
    id: MobileTab.Details,
    label: 'Details',
    icon: <IconLayoutList size={TOGGLE_ICON_SIZE} />,
  },
];

const MobileTabBar = ({ tab, onTab, availableTabs }: MobileTabBarProps) => {
  const visible = availableTabs
    ? TABS.filter((t) => availableTabs.includes(t.id))
    : TABS;

  return (
    <div
      data-testid="mobile-tab-bar"
      className="sticky bottom-0 flex items-stretch border-t border-[var(--mantine-color-default-border)] bg-[var(--mantine-color-body)]"
      style={{ height: MOBILE_DRAWER_TAB_BAR_PX }}
    >
      {visible.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={active}
            aria-label={t.label}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
            style={{
              borderTop: `2px solid ${active ? CITY1_PRIMARY_COLOR : 'transparent'}`,
              color: active
                ? CITY1_PRIMARY_COLOR
                : 'var(--mantine-color-dimmed)',
            }}
          >
            {t.icon}
            <span className="text-[10px] font-semibold tracking-wide">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MobileTabBar;
