import { IconMoon, IconSun } from '@tabler/icons-react';
import MapToggle from '@/components/Shared/MapToggle';
import { MapTheme } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';

const MapThemeToggle = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <MapToggle
      value={theme}
      onChange={setTheme}
      options={[
        {
          value: MapTheme.Light,
          label: 'Light Mode',
          icon: IconSun,
        },
        {
          value: MapTheme.Dark,
          label: 'Dark Mode',
          icon: IconMoon,
        },
      ]}
    />
  );
};

export default MapThemeToggle;
