import { useComputedColorScheme } from '@mantine/core';
import { appColors } from '@/theme';

/**
 * Returns the active glassmorphism token set for the current color scheme.
 * Used by the floating top command bar and its popovers, which keep a glass
 * background in both light and dark mode but with different translucency
 * and accent contrasts.
 */
function useGlassTokens() {
  const scheme = useComputedColorScheme('dark');
  return scheme === 'light' ? appColors.glass.light : appColors.glass.dark;
}

export default useGlassTokens;
