import { Modal } from '@mantine/core';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { WeatherDataUnion } from '@/types/mapTypes';
import useCityData from '@/api/dates/useCityData';
import WeatherDataSection from './WeatherDataSection';
import SunshineDataSection from './SunshineDataSection';
import AdditionalInfo from './AdditionalInfo';

interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth?: number;
}

const CityPopup = ({ city, onClose, selectedMonth }: CityPopupProps) => {
  // Default to current month if not provided (for sunshine data)
  const currentMonth = selectedMonth || new Date().getMonth() + 1; // JavaScript months are 0-indexed

  // Fetch both weather and sunshine data for this city
  const {
    weatherData,
    sunshineData,
    weatherLoading,
    sunshineLoading,
    weatherError,
    sunshineError,
  } = useCityData({
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

  return (
    <Modal opened={!!city} onClose={onClose} title={modalTitle} size="md">
      <div className="flex flex-col gap-3">
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
