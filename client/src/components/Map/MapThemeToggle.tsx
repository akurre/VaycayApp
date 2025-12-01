import { IconMoon, IconSun } from '@tabler/icons-react';
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import MapToggle from '@/components/Shared/MapToggle';

const MapThemeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark');

  return (
    <MapToggle
      size="md"
      value={computedColorScheme}
      onChange={(value) => setColorScheme(value as 'light' | 'dark')}
      options={[
        {
          value: 'light',
          label: 'Light Mode',
          icon: IconSun,
        },
        {
          value: 'dark',
          label: 'Dark Mode',
          icon: IconMoon,
        },
      ]}
    />
  );
};

export default MapThemeToggle;
