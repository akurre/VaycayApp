import SunshineGraphTooltip from './SunshineGraphTooltip';

interface TooltipWrapperProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload: {
      month: string;
      monthIndex: number;
      hours: number | null;
      theoreticalMax?: number | null;
      baseline?: number;
      comparisonHours?: number | null;
      comparisonTheoreticalMax?: number | null;
    };
  }>;
  cityName?: string;
  comparisonCityName?: string;
}

const SunshineGraphTooltipWrapper = ({
  active,
  payload,
  cityName,
  comparisonCityName,
}: TooltipWrapperProps) => (
  <SunshineGraphTooltip
    active={active}
    payload={payload}
    cityName={cityName}
    comparisonCityName={comparisonCityName}
  />
);

export default SunshineGraphTooltipWrapper;
