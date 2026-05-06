import { IconHome } from '@tabler/icons-react';
import { useAppStore } from '@/stores/useAppStore';
import CommandBarTriggerButton from '@/components/Navigation/CommandBarTriggerButton';

interface HomeTriggerButtonProps {
  isOpen: boolean;
}

const HomeTriggerButton = ({ isOpen }: HomeTriggerButtonProps) => {
  const homeLocation = useAppStore((state) => state.homeLocation);

  const label = homeLocation
    ? `${homeLocation.cityName}, ${homeLocation.country}`
    : 'Set Home';

  return (
    <CommandBarTriggerButton isOpen={isOpen} icon={IconHome}>
      {label}
    </CommandBarTriggerButton>
  );
};

export default HomeTriggerButton;
