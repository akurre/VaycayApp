import { Tabs } from '@mantine/core';
import { IconDroplet, IconSun, IconTemperature } from '@tabler/icons-react';
import SunshineDataSection from './SunshineDataSection';
import type { SunshineData } from '@/types/sunshineDataType';

interface DataChartTabsProps {
  displaySunshineData: SunshineData | null;
  sunshineLoading: boolean;
  sunshineError: boolean;
  selectedMonth: number;
}

const DataChartTabs = ({
  displaySunshineData,
  sunshineLoading,
  sunshineError,
  selectedMonth,
}: DataChartTabsProps) => {
  return (
    <Tabs orientation="vertical" defaultValue="sun" className="h-full">
      <Tabs.List>
        <Tabs.Tab value="temp" leftSection={<IconTemperature size={12} />}>
          Temp
        </Tabs.Tab>
        <Tabs.Tab value="sun" leftSection={<IconSun size={12} />}>
          Sun
        </Tabs.Tab>
        <Tabs.Tab value="precip" leftSection={<IconDroplet size={12} />}>
          Precip
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="temp">Temperature chart coming soon</Tabs.Panel>

      <Tabs.Panel value="sun">
        <SunshineDataSection
          displaySunshineData={displaySunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={selectedMonth}
        />
      </Tabs.Panel>

      <Tabs.Panel value="precip">Precipitation chart coming soon</Tabs.Panel>
    </Tabs>
  );
};

export default DataChartTabs;
