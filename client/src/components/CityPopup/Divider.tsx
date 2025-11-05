import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';
import { appColors } from '@/theme';

const Divider = () => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const borderColor = isLightMode ? appColors.light.border : appColors.dark.border;

  return <div className="pt-3" style={{ borderTop: `1px solid ${borderColor}` }} />;
};

export default Divider;
