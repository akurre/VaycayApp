import { Button, Modal, Popover } from '@mantine/core';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { WeatherDataUnion } from '@/types/mapTypes';
import { WeatherData } from '@/types/cityWeatherDataType';
import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import WeatherDataSection from './WeatherDataSection';
import SunshineDataSection from './SunshineDataSection';
import AdditionalInfo from './AdditionalInfo';
import Field from './Field';
import formatDateString from '@/utils/dateFormatting/formatDateString';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';

interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth: number;
  selectedDate?: string;
}

const CityPopup = ({ city, onClose, selectedMonth, selectedDate }: CityPopupProps) => {
  // type guard to check if city is WeatherData
  const isWeatherData = (data: WeatherDataUnion): data is WeatherData => {
    return 'avgTemperature' in data;
  };

  // Determine what type of data we have
  const hasWeatherData = city && isWeatherData(city);
  const hasSunshineData = city && !isWeatherData(city);

  const cityAsWeather = hasWeatherData ? city : null;
  const cityAsSunshine = hasSunshineData ? city : null;

  // determine the month to use with validation
  // prefer selectedMonth from parent, fall back to extracting from weather data
  const monthToUse =
    selectedMonth ?? extractMonthFromDate(cityAsWeather?.date) ?? new Date().getMonth() + 1;

  // construct the date for weather fetching
  // in sunshine mode: use mm-15 format based on selectedMonth
  // in temperature mode: use the actual selectedDate or cityAsWeather.date
  const dateToUse =
    cityAsWeather?.date ??
    (() => {
      if (selectedDate && !hasSunshineData) {
        // temperature mode: use the selected date
        return selectedDate;
      }
      // sunshine mode: construct date from month (mm-15 format)
      const month = monthToUse;
      return `${month.toString().padStart(2, '0')}-15`;
    })();

  // determine if we should fetch weather data
  // fetch when: we don't have weather data and we have a valid date
  const shouldFetchWeather = !hasWeatherData && !!dateToUse;

  // always call hooks unconditionally (rules of hooks)
  const { weatherData, weatherLoading, weatherError } = useWeatherDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    selectedDate: dateToUse,
    skipFetch: !shouldFetchWeather,
  });

  // determine if we should fetch sunshine data
  // fetch when: we don't have sunshine data and we have a valid month
  const shouldFetchSunshine = !hasSunshineData && monthToUse >= 1 && monthToUse <= 12;

  const { sunshineData, sunshineLoading, sunshineError } = useSunshineDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    skipFetch: !shouldFetchSunshine,
  });

  // early return AFTER all hooks have been called
  if (!city) return null;

  // use what we already have, or fall back to fetched data
  const displayWeatherData = cityAsWeather ?? weatherData;
  const displaySunshineData = cityAsSunshine ?? sunshineData;

  // Create the modal title
  let modalTitle = toTitleCase(city.city);
  if (city.state) {
    modalTitle += `, ${toTitleCase(city.state)}`;
  }
  modalTitle += `, ${city.country}`;

  const formattedDate = formatDateString(displayWeatherData?.date);

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
          displayWeatherData={displayWeatherData}
          isLoading={weatherLoading}
          hasError={weatherError}
        />
        <SunshineDataSection
          displaySunshineData={displaySunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={monthToUse}
        />
      </div>
    </Modal>
  );
};

export default CityPopup;
