import isMobileDevice from '@/utils/app/isMobileDevice';
import useIsSmallScreen from '@/hooks/useIsSmallScreen';

const useIsMobileOrSmall = (): boolean => {
  const mobileDevice = isMobileDevice();
  const isSmallScreen = useIsSmallScreen();
  return mobileDevice || isSmallScreen;
};

export default useIsMobileOrSmall;
