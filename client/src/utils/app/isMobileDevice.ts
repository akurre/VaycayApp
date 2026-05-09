import { MOBILE_USER_AGENT_REGEX } from '@/const';

const isMobileDevice = (): boolean => {
  if (
    typeof window === 'undefined' ||
    typeof window.navigator === 'undefined'
  ) {
    return false;
  }
  return MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
};

export default isMobileDevice;
