import { Modal, Text, Title } from '@mantine/core';
import { useAppStore } from '@/stores/useAppStore';
import { appColors } from '@/theme';

export const WelcomeModal = () => {
  const hasSeenWelcomeModal = useAppStore((state) => state.hasSeenWelcomeModal);
  const setHasSeenWelcomeModal = useAppStore(
    (state) => state.setHasSeenWelcomeModal
  );

  const handleClose = () => {
    setHasSeenWelcomeModal(true);
  };

  return (
    <Modal
      opened={!hasSeenWelcomeModal}
      onClose={handleClose}
      centered
      size="md"
      className='px-10 flex justify-center'
    >
      <div className='flex flex-col justify-center gap-4'>
        <Text 
          ta="center" 
          variant="gradient"
          size="xl" 
          gradient={{ from: appColors.primary, to: appColors.secondary, deg: 165 }}
        >
          Welcome to BetterThere!
        </Text>
        <Title order={4} ta="center">
          Hello from Ashlen! 
        </Title>
        <Text ta="center">
          I sourced, cleaned, and processed this data myself, and it comes from
          averaging only 5 years together. Therefore, inaccuracies might occur! 
        </Text>
        <Text ta="center">
          Furthermore, I'm still developing this app, so aesthetics and functionality 
          are projected to change a lot in the near future.
        </Text>
        <Text ta="center">
          If you have any nice ideas of how to make the app better, please submit the
          feedback via the button at the top. I'll get it in my email.
        </Text>
        <Title className='pb-10' order={4} ta="center">
          Enjoy!
        </Title>
      </div>
    </Modal>
  );
};
