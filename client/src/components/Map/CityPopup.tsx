import { Modal, Title } from '@mantine/core';
import { WeatherData } from '../../types/cityWeatherDataType';
import { toTitleCase } from '../../utils/dataFormatting/toTitleCase';
import Field from '../CityPopup/Field';
import LocationSection from '../CityPopup/LocationSection';
import PrecipitationSection from '../CityPopup/PrecipitationSection';
import TemperatureSection from '../CityPopup/TemperatureSection';

interface CityPopupProps {
  city: WeatherData | null;
  onClose: () => void;
}

function CityPopup({ city, onClose }: CityPopupProps) {
  if (!city) return null;

  return (
    <Modal
      opened={!!city}
      onClose={onClose}
      title={
        <Title order={3}>
          {toTitleCase(city.city)}
          {city.country && `, ${city.country}`}
        </Title>
      }
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
          <div className="border-t border-gray-200 pt-3">
            <Field label="Population" value={city.population.toLocaleString()} />
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <Field label="Weather Station" value={city.stationName} />
        </div>

        <LocationSection lat={city.lat} long={city.long} />
      </div>
    </Modal>
  );
}

export default CityPopup;
