import { useMediaQuery } from '@mantine/hooks';
import { MOBILE_BREAKPOINT_PX } from '@/const';

const useIsSmallScreen = (): boolean => {
  const isSmallScreen = useMediaQuery(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
    false,
    { getInitialValueInEffect: true }
  );
  return Boolean(isSmallScreen);
};

export default useIsSmallScreen;
