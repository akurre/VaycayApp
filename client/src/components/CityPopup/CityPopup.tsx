import { Modal, Title } from '@mantine/core';
import { WeatherData } from '@/types/cityWeatherDataType';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { appColors } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';
import Field from './Field';
import LocationSection from './LocationSection';
import PrecipitationSection from './PrecipitationSection';
import TemperatureSection from './TemperatureSection';
import Divider from './Divider';

interface CityPopupProps {
  city: WeatherData | null;
  onClose: () => void;
}

const CityPopup = ({ city, onClose }: CityPopupProps) => {
  const theme = useAppStore((state) => state.theme);
  const isLightMode = theme === MapTheme.Light;
  const backgroundColor = isLightMode ? appColors.light.background : appColors.dark.background;
  const textColor = isLightMode ? appColors.light.text : appColors.dark.text;

  if (!city) return null;

  return (
    <Modal
      opened={!!city}
      onClose={onClose}
      title={
        <span style={{ color: textColor }}>
          {toTitleCase(city.city)}
          {city.country && `, ${city.country}`}
        </span>
      }
      size="md"
      styles={{
        content: {
          backgroundColor,
        },
        header: {
          backgroundColor,
        },
        body: {
          backgroundColor,
        },
      }}
    >
      <div className="flex flex-col gap-3">
        {city.state && <Field label="State/Region" value={toTitleCase(city.state)} />}
        {city.suburb && <Field label="Suburb" value={toTitleCase(city.suburb)} />}
        <Field label="Date" value={city.date} />

        <TemperatureSection
          avgTemperature={city.avgTemperature}
          maxTemperature={city.maxTemperature}
          minTemperature={city.minTemperature}
        />

        {city.precipitation && (
          <PrecipitationSection precipitation={city.precipitation} snowDepth={city.snowDepth} />
        )}

        {city.population && (
          <div>
            <Divider />
            <Field label="Population" value={city.population.toLocaleString()} />
          </div>
        )}

        <div>
          <Divider />
          <Field label="Weather Station" value={city.stationName} />
        </div>

        <LocationSection lat={city.lat} long={city.long} />
      </div>
    </Modal>
  );
};

export default CityPopup;
