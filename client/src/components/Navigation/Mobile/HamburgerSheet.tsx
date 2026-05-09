import { useState } from 'react';
import { Drawer, Switch, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconHome } from '@tabler/icons-react';
import MapThemeToggle from '@/components/Map/MapThemeToggle';
import FeedbackButton from '@/components/Navigation/FeedbackButton';
import HamburgerHomeSubview from './HamburgerHomeSubview';
import { useAppStore } from '@/stores/useAppStore';
import useGlassTokens from '@/hooks/useGlassTokens';
import { MOBILE_HAMBURGER_WIDTH_PX } from '@/const';

interface HamburgerSheetProps {
  opened: boolean;
  onClose: () => void;
}

type DrawerView = 'menu' | 'home';

const HamburgerSheet = ({ opened, onClose }: HamburgerSheetProps) => {
  const [view, setView] = useState<DrawerView>('menu');
  const glass = useGlassTokens();
  const homeLocation = useAppStore((s) => s.homeLocation);
  const legendVisible = useAppStore((s) => s.legendVisible);
  const setLegendVisible = useAppStore((s) => s.setLegendVisible);

  const handleClose = () => {
    setView('menu');
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="left"
      size={`${MOBILE_HAMBURGER_WIDTH_PX}px`}
      title={view === 'menu' ? 'Settings' : undefined}
      closeButtonProps={{ 'aria-label': 'Close menu' }}
      styles={{
        content: {
          background: glass.bgStrong,
          backdropFilter: glass.blurStrong,
          WebkitBackdropFilter: glass.blurStrong,
          border: `1px solid ${glass.borderLight}`,
          boxShadow: glass.shadow,
          color: glass.text,
        },
        header: { background: 'transparent', color: glass.text },
      }}
    >
      {view === 'home' ? (
        <HamburgerHomeSubview onBack={() => setView('menu')} />
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between py-3">
            <Text size="sm" fw={500} style={{ color: glass.text }}>
              Theme
            </Text>
            <MapThemeToggle />
          </div>

          <div className="h-px" style={{ background: glass.divider }} />

          <UnstyledButton
            className="flex items-center justify-between py-3 w-full rounded"
            onClick={() => setView('home')}
          >
            <div className="flex items-center gap-2">
              <IconHome size={16} style={{ color: glass.text }} />
              <div>
                <Text size="sm" fw={500} style={{ color: glass.text }}>
                  Home location
                </Text>
                <Text size="xs" c="dimmed">
                  {homeLocation?.cityName ?? 'Not set'}
                </Text>
              </div>
            </div>
            <IconChevronRight size={16} style={{ color: glass.text }} />
          </UnstyledButton>

          <div className="h-px" style={{ background: glass.divider }} />

          <div className="flex items-center justify-between py-3">
            <Text size="sm" fw={500} style={{ color: glass.text }}>
              Show map legend
            </Text>
            <Switch
              checked={legendVisible}
              onChange={(e) => setLegendVisible(e.currentTarget.checked)}
              aria-label="Toggle map legend"
            />
          </div>

          <div className="h-px" style={{ background: glass.divider }} />

          <div className="py-3">
            <FeedbackButton />
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default HamburgerSheet;
