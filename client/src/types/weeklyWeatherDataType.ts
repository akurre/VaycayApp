export interface WeekDataPoint {
  week: number;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  totalPrecip: number | null;
  avgPrecip: number | null;
  daysWithRain: number | null;
  daysWithData: number;
}

export interface CityWeeklyWeather {
  city: string;
  country: string;
  state: string | null;
  lat: number | null;
  long: number | null;
  weeklyData: WeekDataPoint[];
}
