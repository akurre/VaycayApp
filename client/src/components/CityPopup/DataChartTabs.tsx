import { Tabs } from '@mantine/core';
import { IconDroplet, IconSun, IconTemperature } from '@tabler/icons-react';
import SunshineDataSection from './SunshineDataSection';
import TemperatureDataSection from './TemperatureDataSection';
import RainfallDataSection from './RainfallDataSection';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { DataType } from '@/types/mapTypes';

interface DataChartTabsProps {
  displaySunshineData: SunshineData | null;
  sunshineLoading: boolean;
  sunshineError: boolean;
  selectedMonth: number;
  weeklyWeatherData: CityWeeklyWeather | null;
  weeklyWeatherLoading: boolean;
  weeklyWeatherError: boolean;
  dataType: DataType;
}

const DataChartTabs = ({
  displaySunshineData,
  sunshineLoading,
  sunshineError,
  selectedMonth,
  weeklyWeatherData,
  weeklyWeatherLoading,
  weeklyWeatherError,
  dataType,
}: DataChartTabsProps) => {
  return (
    <Tabs orientation="vertical" defaultValue={dataType} className="h-full flex">
      <Tabs.List>
        <Tabs.Tab value="temperature" leftSection={<IconTemperature size={12} />}>
          Temp
        </Tabs.Tab>
        <Tabs.Tab value="sunshine" leftSection={<IconSun size={12} />}>
          Sun
        </Tabs.Tab>
        <Tabs.Tab value="precip" leftSection={<IconDroplet size={12} />}>
          Precip
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="temperature" className="flex-1 min-h-0">
        <TemperatureDataSection
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
        />
      </Tabs.Panel>

      <Tabs.Panel value="sunshine" className="flex-1 min-h-0">
        <SunshineDataSection
          displaySunshineData={displaySunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={selectedMonth}
        />
      </Tabs.Panel>

      <Tabs.Panel value="precip" className="flex-1 min-h-0">
        <RainfallDataSection
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
        />
      </Tabs.Panel>
    </Tabs>
  );
};

export default DataChartTabs;
