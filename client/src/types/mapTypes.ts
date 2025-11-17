import { WeatherData } from './cityWeatherDataType';
import { SunshineData } from './sunshineDataType';

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
