import { Modal } from '@mantine/core';
import { WeatherData } from '@/types/cityWeatherDataType';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
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
  if (!city) return null;

  return (
    <Modal
      opened={!!city}
      onClose={onClose}
      title={`${toTitleCase(city.city)}${city.country ? `, ${city.country}` : ''}`}
      size="md"
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
