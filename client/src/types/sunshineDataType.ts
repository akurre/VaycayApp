// sunshine data type definitions for monthly sunshine hours visualization

export interface SunshineData {
  cityId: number;
  city: string;
  country: string;
  state?: string;
  suburb?: string;
  lat: number | null;
  long: number | null;
  population: number | null;
  jan: number | null;
  feb: number | null;
  mar: number | null;
  apr: number | null;
  may: number | null;
  jun: number | null;
  jul: number | null;
  aug: number | null;
  sep: number | null;
  oct: number | null;
  nov: number | null;
  dec: number | null;
  stationName?: string;
}

// guaranteed non-null lat, long, and at least one month value
export interface ValidSunshineMarkerData extends SunshineData {
  lat: number;
  long: number;
}

export interface SunshineByMonthResponse {
  sunshineByMonth: SunshineData[];
  sunshineByMonthAndBounds?: SunshineData[];
}

export interface SunshineByMonthVars {
  month: number;
}

export interface SunshineByMonthAndBoundsVars extends SunshineByMonthVars {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}
