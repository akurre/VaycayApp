import { describe, it, expect, beforeEach } from 'vitest';
import isMobileDevice from '@/utils/app/isMobileDevice';

const setUserAgent = (ua: string): void => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
    writable: true,
  });
};

const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

describe('isMobileDevice', () => {
  beforeEach(() => {
    setUserAgent(DESKTOP_UA);
  });

  it('returns false for desktop Chrome user agent', () => {
    expect(isMobileDevice()).toBe(false);
  });

  it('returns true for iPhone user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for Android user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for iPad user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for Chrome on iOS (CriOS) user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for BlackBerry user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns true for IEMobile user agent', () => {
    setUserAgent(
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0)'
    );
    expect(isMobileDevice()).toBe(true);
  });

  it('returns false for an empty user agent string', () => {
    setUserAgent('');
    expect(isMobileDevice()).toBe(false);
  });
});
