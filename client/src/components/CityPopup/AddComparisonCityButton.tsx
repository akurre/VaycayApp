import { IconPlus } from '@tabler/icons-react';
import { CITY2_PRIMARY_COLOR } from '@/const';

interface AddComparisonCityButtonProps {
  onClick: () => void;
  variant: 'desktop' | 'mobile';
}

const AddComparisonCityButton = ({
  onClick,
  variant,
}: AddComparisonCityButtonProps) => {
  const isDesktop = variant === 'desktop';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add comparison city"
      className={`flex items-center gap-2 cursor-pointer text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] transition-colors${isDesktop ? ' min-w-0' : ' self-start'}`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full opacity-60${isDesktop ? ' shrink-0' : ''}`}
        style={{ background: CITY2_PRIMARY_COLOR }}
      />
      <span
        className={`font-bold font-[Outfit_Variable]${isDesktop ? ' text-[17px]' : ' text-[15px]'}`}
      >
        Compare
      </span>
      <IconPlus
        size={14}
        className={`opacity-70${isDesktop ? ' shrink-0' : ''}`}
      />
    </button>
  );
};

export default AddComparisonCityButton;
