import type { WeatherData } from './cityWeatherDataType';
import type { SunshineData } from './sunshineDataType';

export enum MapTheme {
  Light = 'light',
  Dark = 'dark',
}

export enum ViewMode {
  Heatmap = 'heatmap',
  Markers = 'markers',
}

export enum DataType {
  Temperature = 'temperature',
  Sunshine = 'sunshine',
}

export type WeatherDataUnion = WeatherData | SunshineData;

export interface CityPopupProps {
  city: WeatherDataUnion | null;
  onClose: () => void;
  selectedMonth: number;
  selectedDate?: string;
  dataType: DataType;
}
