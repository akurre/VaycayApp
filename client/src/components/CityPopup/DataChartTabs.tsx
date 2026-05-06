import SunshineDataSection from './SunshineDataSection';
import TemperatureDataSection from './TemperatureDataSection';
import RainfallDataSection from './RainfallDataSection';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import { DataType } from '@/types/mapTypes';

interface DataChartTabsProps {
  tab: DataType;
  displaySunshineData: SunshineData | null;
  sunshineLoading: boolean;
  sunshineError: boolean;
  selectedMonth: number;
  weeklyWeatherData: CityWeeklyWeather | null;
  weeklyWeatherLoading: boolean;
  weeklyWeatherError: boolean;
  comparisonSunshineData?: SunshineData | null;
  comparisonWeeklyWeatherData?: CityWeeklyWeather | null;
  onHover?: (payload: RibbonHoverPayload | null) => void;
}

const DataChartTabs = ({
  tab,
  displaySunshineData,
  sunshineLoading,
  sunshineError,
  selectedMonth,
  weeklyWeatherData,
  weeklyWeatherLoading,
  weeklyWeatherError,
  comparisonSunshineData,
  comparisonWeeklyWeatherData,
  onHover,
}: DataChartTabsProps) => {
  return (
    <div className="h-full w-full">
      {tab === DataType.Temperature && (
        <TemperatureDataSection
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
          comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
          onHover={onHover}
        />
      )}
      {tab === DataType.Sunshine && (
        <SunshineDataSection
          displaySunshineData={displaySunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={selectedMonth}
          comparisonSunshineData={comparisonSunshineData}
          onHover={onHover}
        />
      )}
      {tab === DataType.Precip && (
        <RainfallDataSection
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
          comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
          onHover={onHover}
        />
      )}
    </div>
  );
};

export default DataChartTabs;
