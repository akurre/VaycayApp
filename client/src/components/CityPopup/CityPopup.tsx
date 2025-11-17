import { Divider, Modal, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { WeatherDataUnion } from '@/types/mapTypes';
import useCityData from '@/api/dates/useCityData';
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
  
  // Default to current month if not provided (for sunshine data)
  const currentMonth = selectedMonth || new Date().getMonth() + 1; // JavaScript months are 0-indexed
  
  // Fetch both weather and sunshine data for this city
  const { weatherData, sunshineData, isLoading, hasError } = useCityData({
    cityName: city.city,
    lat: city.lat,
    long: city.long,
    selectedMonth: currentMonth
  });
  
  // Determine which data to use for display
  // If we're viewing a weather city, use that data directly, otherwise use fetched data
  const displayWeatherData = isWeatherData(city) ? city : weatherData;
  
  // If we're viewing a sunshine city, use that data directly, otherwise use fetched data
  const displaySunshineData = isSunshineData(city) ? city : sunshineData;

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

        {/* Weather data section */}
        {isLoading && !displayWeatherData ? (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        ) : hasError && !displayWeatherData ? (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
            Failed to load temperature data for this city.
          </Alert>
        ) : displayWeatherData ? (
          <>
            <Field label="Date" value={displayWeatherData.date} />

            <TemperatureSection
              avgTemperature={displayWeatherData.avgTemperature}
              maxTemperature={displayWeatherData.maxTemperature}
              minTemperature={displayWeatherData.minTemperature}
            />

            {displayWeatherData.precipitation && (
              <PrecipitationSection 
                precipitation={displayWeatherData.precipitation} 
                snowDepth={displayWeatherData.snowDepth} 
              />
            )}
          </>
        ) : null}

        {/* Sunshine data section */}
        {isLoading && !displaySunshineData ? (
          <div className="flex justify-center py-4">
            <Loader size="sm" />
          </div>
        ) : hasError && !displaySunshineData ? (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" title="Error">
            Failed to load sunshine data for this city.
          </Alert>
        ) : displaySunshineData ? (
          <SunshineSection sunshineData={displaySunshineData} selectedMonth={currentMonth} />
        ) : null}

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
