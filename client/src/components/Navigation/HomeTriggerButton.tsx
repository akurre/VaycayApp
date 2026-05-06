import { Button, useMantineColorScheme } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import { TOGGLE_ICON_SIZE } from '@/const';
import { useAppStore } from '@/stores/useAppStore';
import { secondaryOceanShades } from '@/theme';

interface HomeTriggerButtonProps {
  isOpen: boolean;
}

const HomeTriggerButton = ({ isOpen }: HomeTriggerButtonProps) => {
  const homeLocation = useAppStore((state) => state.homeLocation);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const label = homeLocation
    ? `${homeLocation.cityName}, ${homeLocation.country}`
    : 'Set Home';

  return (
    <Button
      variant={isOpen ? 'light' : 'outline'}
      size="xs"
      color={isDark ? secondaryOceanShades[2] : secondaryOceanShades[4]}
      leftSection={<IconHome size={TOGGLE_ICON_SIZE} />}
    >
      {label}
    </Button>
  );
};

export default HomeTriggerButton;
