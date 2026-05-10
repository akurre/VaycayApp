import { IconPlus } from '@tabler/icons-react';
import { formatCityPopulationSuffix } from '@/utils/dataFormatting/formatCityPopulationSuffix';
import type { SearchCitiesResult } from '@/types/userLocationType';

interface CitySearchResultRowProps {
  city: SearchCitiesResult;
  onClick: () => void;
  variant: 'desktop' | 'mobile';
  showAddIcon?: boolean;
}

const CitySearchResultRow = ({
  city,
  onClick,
  variant,
  showAddIcon = false,
}: CitySearchResultRowProps) => {
  const subtitle = (
    <>
      {city.state ? `${city.state}, ` : ''}
      {city.country}
      {formatCityPopulationSuffix(city.population)}
    </>
  );

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-3 py-3 rounded-md transition-colors hover:bg-[var(--mantine-color-default-hover)] cursor-pointer${showAddIcon ? ' flex items-center justify-between' : ''}`}
      >
        <span className={showAddIcon ? 'min-w-0 flex-1 mr-2' : undefined}>
          <span className="block font-bold text-[15px] text-[var(--mantine-color-text)] truncate">
            {city.name}
          </span>
          <span className="block text-xs text-[var(--mantine-color-dimmed)] truncate">
            {subtitle}
          </span>
        </span>
        {showAddIcon && (
          <IconPlus
            size={16}
            className="opacity-60 shrink-0"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--mantine-color-default-border)] cursor-pointer"
    >
      <div className="font-medium text-[var(--mantine-color-text)]">
        {city.name}
      </div>
      <div className="text-xs text-[var(--mantine-color-dimmed)]">
        {subtitle}
      </div>
    </button>
  );
};

export default CitySearchResultRow;
