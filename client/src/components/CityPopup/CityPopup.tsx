import { Button, Modal, Popover } from '@mantine/core';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { WeatherDataUnion } from '@/types/mapTypes';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import WeatherDataSection from './WeatherDataSection';
import SunshineDataSection from './SunshineDataSection';
import AdditionalInfo from './AdditionalInfo';
import Field from './Field';
import formatDateString from '@/utils/dateFormatting/formatDateString';

interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth?: number;
  selectedDate?: string;
}

const CityPopup = ({ city, onClose, selectedMonth, selectedDate }: CityPopupProps) => {
  // Default to current month if not provided (for sunshine data)
  const currentMonth = selectedMonth || new Date().getMonth() + 1; // JavaScript months are 0-indexed
  
  // Default to today's date if not provided (for weather data)
  const currentDate = selectedDate || `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

  // Fetch weather data for this city on the selected date
  const {
    weatherData,
    weatherLoading,
    weatherError,
  } = useWeatherDataForCity({
    cityName: city?.city || null,
    lat: city?.lat || null,
    long: city?.long || null,
    selectedDate: currentDate,
  });

  // Fetch sunshine data for this city in the selected month
  const {
    sunshineData,
    sunshineLoading,
    sunshineError,
  } = useSunshineDataForCity({
    cityName: city?.city || null,
    lat: city?.lat || null,
    long: city?.long || null,
    selectedMonth: currentMonth,
  });

  if (!city) return null;

  // Create the modal title
  let modalTitle = toTitleCase(city.city);
  if (city.state) {
    modalTitle += `, ${toTitleCase(city.state)}`;
  }
  modalTitle += `, ${city.country}`;

  const formattedDate = formatDateString(weatherData?.date);

  return (
    <Modal opened={!!city} onClose={onClose} title={modalTitle} size="md">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Field label="Date" value={formattedDate} />
          <Popover position="bottom" withArrow shadow="md">
            <Popover.Target>
              {/* varient below doesnt change anything */}
              <Button variant="subtle" size="compact-xs">
                More Info
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              {city.stationName && (
                <div>
                  <Field label="Weather Station" value={city.stationName} />
                </div>
              )}
              {city.lat && city.long && (
                <Field
                  label="Coordinates"
                  value={`${city.lat.toFixed(4)}°, ${city.long.toFixed(4)}°`}
                  monospace
                />
              )}
            </Popover.Dropdown>
          </Popover>
        </div>
        <AdditionalInfo city={city} />
        <WeatherDataSection
          displayWeatherData={weatherData}
          isLoading={weatherLoading}
          hasError={weatherError}
        />
        <SunshineDataSection
          displaySunshineData={sunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={currentMonth}
        />
      </div>
    </Modal>
  );
};

export default CityPopup;
