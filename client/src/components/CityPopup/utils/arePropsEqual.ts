import type { CityPopupProps } from '@/types/mapTypes';

// custom comparison function to prevent unnecessary re-renders
function arePropsEqual(prevProps: CityPopupProps, nextProps: CityPopupProps): boolean {
  // check if city objects are the same by comparing key properties
  const prevCity = prevProps.city;
  const nextCity = nextProps.city;

  if (prevCity === nextCity) return true;
  if (!prevCity || !nextCity) return false;

  // compare city identity by key properties
  const cityEqual =
    prevCity.city === nextCity.city &&
    prevCity.country === nextCity.country &&
    prevCity.lat === nextCity.lat &&
    prevCity.long === nextCity.long;

  // compare other props
  const propsEqual =
    prevProps.selectedMonth === nextProps.selectedMonth &&
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.dataType === nextProps.dataType;

  return cityEqual && propsEqual;
}

export default arePropsEqual;
