import { ActionIcon, Text } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import HomeLocationContent from '@/components/Navigation/HomeLocationContent';
import useGlassTokens from '@/hooks/useGlassTokens';

interface HamburgerHomeSubviewProps {
  onBack: () => void;
}

const HamburgerHomeSubview = ({ onBack }: HamburgerHomeSubviewProps) => {
  const glass = useGlassTokens();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ActionIcon variant="subtle" onClick={onBack} aria-label="Back to menu">
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={600} size="sm" style={{ color: glass.text }}>
          Home Location
        </Text>
      </div>
      <HomeLocationContent />
    </div>
  );
};

export default HamburgerHomeSubview;
