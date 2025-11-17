import { Divider, Modal } from '@mantine/core';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { WeatherDataUnion } from '@/types/mapTypes';
import Field from './Field';
import LocationSection from './LocationSection';
import PrecipitationSection from './PrecipitationSection';
import TemperatureSection from './TemperatureSection';
import SunshineSection from './SunshineSection';
import DistanceSection from './DistanceSection';

interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth?: number;
}

// Type guards
const isWeatherData = (data: WeatherDataUnion | null): data is WeatherData => {
  return data !== null && 'avgTemperature' in data;
};

const isSunshineData = (data: WeatherDataUnion | null): data is SunshineData => {
  return data !== null && 'jan' in data;
};

const CityPopup = ({ city, onClose, selectedMonth }: CityPopupProps) => {
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

        {/* Weather data specific sections */}
        {isWeatherData(city) && (
          <>
            <Field label="Date" value={city.date} />

            <TemperatureSection
              avgTemperature={city.avgTemperature}
              maxTemperature={city.maxTemperature}
              minTemperature={city.minTemperature}
            />

            {city.precipitation && (
              <PrecipitationSection precipitation={city.precipitation} snowDepth={city.snowDepth} />
            )}
          </>
        )}

        {/* Sunshine data specific section */}
        {isSunshineData(city) && selectedMonth && (
          <SunshineSection sunshineData={city} selectedMonth={selectedMonth} />
        )}

        {city.population && (
          <div>
            <Divider />
            <Field label="Population" value={city.population.toLocaleString()} />
          </div>
        )}

        {city.stationName && (
          <div>
            <Divider />
            <Field label="Weather Station" value={city.stationName} />
          </div>
        )}

        <LocationSection lat={city.lat} long={city.long} />

        <DistanceSection lat={city.lat} long={city.long} />
      </div>
    </Modal>
  );
};

export default CityPopup;
