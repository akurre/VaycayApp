export interface WeatherData {
  city: string;
  country: string | null;
  state: string | null;
  suburb: string | null;
  date: string;
  lat: number | null;
  long: number | null;
  population: number | null;
  precipitation: number | null;
  snowDepth: number | null;
  avgTemperature: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  stationName: string;
  submitterId: string | null;
}

// type for weather data with guaranteed non-null coordinates and temperature
// used for map markers where these values are required
export type ValidMarkerData = WeatherData & {
  lat: number;
  long: number;
  avgTemperature: number;
};

export interface WeatherByDateResponse {
  weatherByDate: WeatherData[];
  weatherByDateAndBounds?: WeatherData[];
}

export interface WeatherByDateVars {
  monthDay: string;
}
