// types for user location and home location functionality

export interface Coordinates {
  lat: number;
  long: number;
}

export interface CityInfo {
  id: number;
  name: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  population: number | null;
}

export interface HomeLocation {
  cityId: number;
  cityName: string;
  country: string;
  state: string | null;
  coordinates: Coordinates;
  source: 'geolocation' | 'manual';
}

export interface NearestCityResult extends CityInfo {
  distance: number;
}

export interface SearchCitiesResult extends CityInfo {}

export enum LocationSource {
  Geolocation = 'geolocation',
  Manual = 'manual',
}
