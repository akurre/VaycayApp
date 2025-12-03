import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily_units: {
    time: string;
    temperature_2m_mean?: string;
    temperature_2m_max?: string;
    temperature_2m_min?: string;
    apparent_temperature_mean?: string;
    apparent_temperature_max?: string;
    apparent_temperature_min?: string;
    wind_speed_10m_max?: string;
    sunshine_duration?: string;
    cloud_cover_mean?: string;
    dew_point_2m_mean?: string;
    relative_humidity_2m_mean?: string;
    snowfall_water_equivalent_sum?: string;
    soil_moisture_0_to_100cm_mean?: string;
    daylight_duration?: string;
    precipitation_sum?: string;
    rain_sum?: string;
    snowfall_sum?: string;
    precipitation_hours?: string;
  };
  daily: {
    time: string[];
    temperature_2m_mean?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    apparent_temperature_mean?: (number | null)[];
    apparent_temperature_max?: (number | null)[];
    apparent_temperature_min?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
    sunshine_duration?: (number | null)[];
    cloud_cover_mean?: (number | null)[];
    dew_point_2m_mean?: (number | null)[];
    relative_humidity_2m_mean?: (number | null)[];
    snowfall_water_equivalent_sum?: (number | null)[];
    soil_moisture_0_to_100cm_mean?: (number | null)[];
    daylight_duration?: (number | null)[];
    precipitation_sum?: (number | null)[];
    rain_sum?: (number | null)[];
    snowfall_sum?: (number | null)[];
    precipitation_hours?: (number | null)[];
  };
}

interface DailyMetrics {
  temperature_2m_mean: number | null;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  apparent_temperature_mean: number | null;
  apparent_temperature_max: number | null;
  apparent_temperature_min: number | null;
  wind_speed_10m_max: number | null;
  sunshine_duration: number | null;
  cloud_cover_mean: number | null;
  dew_point_2m_mean: number | null;
  relative_humidity_2m_mean: number | null;
  snowfall_water_equivalent_sum: number | null;
  soil_moisture_0_to_100cm_mean: number | null;
  daylight_duration: number | null;
  precipitation_sum: number | null;
  rain_sum: number | null;
  snowfall_sum: number | null;
  precipitation_hours: number | null;
}

interface SyntheticDayData {
  date: string; // "2020-01-01" through "2020-12-31"
  metrics: DailyMetrics;
}

interface City {
  id: number;
  name: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  population: number | null;
  cityAscii: string | null;
  iso2: string | null;
  iso3: string | null;
  capital: string | null;
  worldcitiesId: number | null;
}

interface CSVRow {
  city: string;
  country: string;
  state: string;
  suburb: string;
  date: string;
  city_ascii: string;
  iso2: string;
  iso3: string;
  capital: string;
  worldcities_id: string;
  data_source: string;
  AWND: string;
  DAPR: string;
  DATN: string;
  DATX: string;
  DWPR: string;
  EVAP: string;
  MDPR: string;
  MDTN: string;
  MDTX: string;
  PGTM: string;
  PRCP: string | number;
  SN32: string;
  SN52: string;
  SNOW: string;
  SNWD: string | number;
  SX32: string;
  SX52: string;
  TAVG: string | number;
  TMAX: string | number;
  TMIN: string | number;
  TOBS: string;
  WDF2: string;
  WDF5: string;
  WDFG: string;
  WDMV: string;
  WESD: string;
  WESF: string;
  WSF2: string;
  WSF5: string;
  WSFG: string;
  WT01: string;
  WT02: string;
  WT03: string;
  WT04: string;
  WT05: string;
  WT06: string;
  WT07: string;
  WT08: string;
  WT09: string;
  WT11: string;
  lat: number;
  long: number;
  population: string | number;
  name: string;
  apparentTempMean: string | number;
  apparentTempMax: string | number;
  apparentTempMin: string | number;
  windSpeed10mMax: string | number;
  sunshineDuration: string | number;
  cloudCoverMean: string | number;
  dewPoint2mMean: string | number;
  relativeHumidity2mMean: string | number;
  snowfallWaterEquivSum: string | number;
  soilMoisture0to100cmMean: string | number;
  daylightDuration: string | number;
  rainSum: string | number;
  snowfallSum: string | number;
  precipitationHours: string | number;
}

interface Checkpoint {
  lastCityId: number | null;
  batchNumber: number;
  totalCities: number;
  totalRecords: number;
  timestamp: string;
}

interface FailedCity {
  cityId: number;
  cityName: string;
  yearRange: string;
  error: string;
  timestamp: string;
}

interface DuplicateCityGroup {
  cityName: string;
  country: string;
  states: string[];
  totalStations: number;
  uniqueCitiesKept: number; // Number of unique state variants kept
  note: string;
  keptStations: Array<{
    id: number;
    state: string | null;
    lat: number;
    long: number;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECKPOINT_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/fetch_progress.json');
const FAILED_CITIES_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/failed_cities.json');
const DUPLICATE_CITIES_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/duplicate_cities.json');
const OUTPUT_DIR = path.join(__dirname, '../../dataAndUtils/openMeteoData');
const BATCH_SIZE = 50; // cities per batch file
const CHECKPOINT_INTERVAL = 25; // save checkpoint every N cities
const MIN_POPULATION = 100000;

// CSV column order (67 fields total)
const CSV_COLUMNS = [
  'city', 'country', 'state', 'suburb', 'date', 'city_ascii', 'iso2', 'iso3', 'capital', 'worldcities_id', 'data_source',
  'AWND', 'DAPR', 'DATN', 'DATX', 'DWPR', 'EVAP', 'MDPR', 'MDTN', 'MDTX', 'PGTM', 'PRCP', 'SN32', 'SN52', 'SNOW', 'SNWD',
  'SX32', 'SX52', 'TAVG', 'TMAX', 'TMIN', 'TOBS', 'WDF2', 'WDF5', 'WDFG', 'WDMV', 'WESD', 'WESF', 'WSF2', 'WSF5', 'WSFG',
  'WT01', 'WT02', 'WT03', 'WT04', 'WT05', 'WT06', 'WT07', 'WT08', 'WT09', 'WT11',
  'lat', 'long', 'population', 'name',
  'apparentTempMean', 'apparentTempMax', 'apparentTempMin', 'windSpeed10mMax', 'sunshineDuration', 'cloudCoverMean',
  'dewPoint2mMean', 'relativeHumidity2mMean', 'snowfallWaterEquivSum', 'soilMoisture0to100cmMean', 'daylightDuration',
  'rainSum', 'snowfallSum', 'precipitationHours'
];

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

interface RateLimitWindow {
  timestamps: number[];
  limit: number;
  windowMs: number;
}

class RateLimiter {
  // EXTREMELY CONSERVATIVE limits to avoid IP blocking
  // Open-Meteo free tier: 10,000/day, 5,000/hour, 600/minute
  // We use VERY conservative values - better slow than blocked!
  private requestsPerMinute = 10;   // Extremely conservative: 10 instead of 600
  private requestsPerHour = 400;    // Extremely conservative: 400 instead of 5000
  private requestsPerDay = 5000;    // Very conservative: 5000 instead of 10000

  // Minimum delay between requests (in ms)
  // With 20 seconds between requests, max rate = 3 requests/minute (well under 10 limit)
  // This translates to ~22 hours for full dataset, but ensures we NEVER get blocked
  private minDelayBetweenRequests = 20000; // 20 seconds minimum between requests
  private lastRequestTime = 0;

  private minuteWindow: RateLimitWindow = {
    timestamps: [],
    limit: this.requestsPerMinute,
    windowMs: 60 * 1000
  };

  private hourWindow: RateLimitWindow = {
    timestamps: [],
    limit: this.requestsPerHour,
    windowMs: 60 * 60 * 1000
  };

  private dayWindow: RateLimitWindow = {
    timestamps: [],
    limit: this.requestsPerDay,
    windowMs: 24 * 60 * 60 * 1000
  };

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Enforce minimum delay between requests to avoid instant rate limiting
    if (this.lastRequestTime > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        const additionalDelay = this.minDelayBetweenRequests - timeSinceLastRequest;
        console.log(`⏱️  Enforcing ${Math.ceil(additionalDelay / 1000)}s delay (${Math.ceil(timeSinceLastRequest / 1000)}s since last request)...`);
        await new Promise(resolve => setTimeout(resolve, additionalDelay));
      }
    }

    // Clean old timestamps outside windows
    const currentTime = Date.now();
    this.cleanWindow(this.minuteWindow, currentTime);
    this.cleanWindow(this.hourWindow, currentTime);
    this.cleanWindow(this.dayWindow, currentTime);

    // Get optimal wait time (predictive)
    const waitTime = this.getOptimalWaitTime(currentTime);

    if (waitTime > 0) {
      const windowName = this.getBlockingWindow(currentTime);
      console.log(`⏳ Rate limit reached (${windowName}), waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));

      // Clean again after waiting
      this.cleanWindow(this.minuteWindow, Date.now());
      this.cleanWindow(this.hourWindow, Date.now());
      this.cleanWindow(this.dayWindow, Date.now());
    }

    // Record this request
    const requestTime = Date.now();
    this.lastRequestTime = requestTime;
    this.minuteWindow.timestamps.push(requestTime);
    this.hourWindow.timestamps.push(requestTime);
    this.dayWindow.timestamps.push(requestTime);
  }

  /**
   * Calculate the minimum wait time needed to make the next request
   * Returns 0 if request can be made immediately
   */
  private getOptimalWaitTime(now: number): number {
    const delays = [
      this.calculateDelay(this.minuteWindow, now),
      this.calculateDelay(this.hourWindow, now),
      this.calculateDelay(this.dayWindow, now)
    ];
    return Math.max(...delays);
  }

  /**
   * Identify which window is blocking the request
   */
  private getBlockingWindow(now: number): string {
    if (this.calculateDelay(this.minuteWindow, now) > 0) return 'minute';
    if (this.calculateDelay(this.hourWindow, now) > 0) return 'hour';
    if (this.calculateDelay(this.dayWindow, now) > 0) return 'day';
    return 'none';
  }

  private cleanWindow(window: RateLimitWindow, now: number): void {
    const cutoff = now - window.windowMs;
    window.timestamps = window.timestamps.filter(ts => ts > cutoff);
  }

  private calculateDelay(window: RateLimitWindow, now: number): number {
    if (window.timestamps.length < window.limit) {
      return 0;
    }
    const oldestInWindow = window.timestamps[0];
    const timeToWait = window.windowMs - (now - oldestInWindow);
    return Math.max(0, timeToWait);
  }

  getStatus(): { minute: number; hour: number; day: number } {
    return {
      minute: this.minuteWindow.timestamps.length,
      hour: this.hourWindow.timestamps.length,
      day: this.dayWindow.timestamps.length
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load checkpoint from file
 */
function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    const data = fs.readFileSync(CHECKPOINT_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return {
    lastCityId: null,
    batchNumber: 1,
    totalCities: 0,
    totalRecords: 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Save checkpoint to file
 */
function saveCheckpoint(checkpoint: Checkpoint): void {
  fs.mkdirSync(path.dirname(CHECKPOINT_PATH), { recursive: true });
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2));
}

/**
 * Log failed city to file
 */
function logFailedCity(city: City, yearRange: string, error: any): void {
  const failedCity: FailedCity = {
    cityId: city.id,
    cityName: `${city.name}, ${city.country}`,
    yearRange,
    error: error.message || String(error),
    timestamp: new Date().toISOString()
  };

  let failures: FailedCity[] = [];
  if (fs.existsSync(FAILED_CITIES_PATH)) {
    const data = fs.readFileSync(FAILED_CITIES_PATH, 'utf-8');
    failures = JSON.parse(data);
  }

  failures.push(failedCity);
  fs.writeFileSync(FAILED_CITIES_PATH, JSON.stringify(failures, null, 2));
}

/**
 * Fetch with retry logic for rate limiting
 */
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // If rate limited, wait and retry with exponential backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(60000, 5000 * Math.pow(2, attempt)); // Exponential backoff: 5s, 10s, 20s (max 60s)

        console.log(`⚠️  Rate limited (429). Waiting ${Math.ceil(waitTime / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = 5000 * Math.pow(2, attempt);
        console.log(`⚠️  Request failed: ${error.message}. Retrying in ${waitTime / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Build Open-Meteo API URL
 */
function buildOpenMeteoURL(lat: number, long: number, startDate: string, endDate: string): string {
  const baseURL = 'https://archive-api.open-meteo.com/v1/archive';
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: long.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: [
      'temperature_2m_mean',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_mean',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'wind_speed_10m_max',
      'sunshine_duration',
      'cloud_cover_mean',
      'dew_point_2m_mean',
      'relative_humidity_2m_mean',
      'snowfall_water_equivalent_sum',
      'soil_moisture_0_to_100cm_mean',
      'daylight_duration',
      'precipitation_sum',
      'rain_sum',
      'snowfall_sum',
      'precipitation_hours'
    ].join(',')
  });
  return `${baseURL}?${params}`;
}

/**
 * Create CSV writer for a batch
 */
function createBatchWriter(batchNumber: number): any {
  const batchDir = path.join(OUTPUT_DIR, `batch${batchNumber}`);
  fs.mkdirSync(batchDir, { recursive: true });

  const csvPath = path.join(batchDir, `batch${batchNumber}_open_meteo_data.csv`);
  const writeStream = fs.createWriteStream(csvPath);
  const stringifier = stringify({ header: true, columns: CSV_COLUMNS });

  stringifier.pipe(writeStream);

  return {
    write: (row: CSVRow) => stringifier.write(row),
    end: () => new Promise<void>((resolve, reject) => {
      stringifier.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    })
  };
}

// ============================================================================
// MULTI-YEAR AVERAGING FUNCTION
// ============================================================================

/**
 * Averages multi-year API data into 366 synthetic days
 *
 * Example: For 2021-2024 data (1,461 days):
 * - All Jan 1 values (2021-01-01, 2022-01-01, 2023-01-01, 2024-01-01) → averaged to synthetic "2020-01-01"
 * - All Jan 2 values (2021-01-02, 2022-01-02, 2023-01-02, 2024-01-02) → averaged to synthetic "2020-01-02"
 * - etc.
 */
function averageMultiYearToSyntheticYear(apiData: OpenMeteoResponse): SyntheticDayData[] {
  const { daily } = apiData;

  // Group data by month-day (ignoring year)
  const dayGroups = new Map<string, DailyMetrics[]>();

  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i]; // e.g., "2021-01-15"
    const monthDay = date.substring(5); // Extract "01-15"

    if (!dayGroups.has(monthDay)) {
      dayGroups.set(monthDay, []);
    }

    dayGroups.get(monthDay)!.push({
      temperature_2m_mean: daily.temperature_2m_mean?.[i] ?? null,
      temperature_2m_max: daily.temperature_2m_max?.[i] ?? null,
      temperature_2m_min: daily.temperature_2m_min?.[i] ?? null,
      apparent_temperature_mean: daily.apparent_temperature_mean?.[i] ?? null,
      apparent_temperature_max: daily.apparent_temperature_max?.[i] ?? null,
      apparent_temperature_min: daily.apparent_temperature_min?.[i] ?? null,
      wind_speed_10m_max: daily.wind_speed_10m_max?.[i] ?? null,
      sunshine_duration: daily.sunshine_duration?.[i] ?? null,
      cloud_cover_mean: daily.cloud_cover_mean?.[i] ?? null,
      dew_point_2m_mean: daily.dew_point_2m_mean?.[i] ?? null,
      relative_humidity_2m_mean: daily.relative_humidity_2m_mean?.[i] ?? null,
      snowfall_water_equivalent_sum: daily.snowfall_water_equivalent_sum?.[i] ?? null,
      soil_moisture_0_to_100cm_mean: daily.soil_moisture_0_to_100cm_mean?.[i] ?? null,
      daylight_duration: daily.daylight_duration?.[i] ?? null,
      precipitation_sum: daily.precipitation_sum?.[i] ?? null,
      rain_sum: daily.rain_sum?.[i] ?? null,
      snowfall_sum: daily.snowfall_sum?.[i] ?? null,
      precipitation_hours: daily.precipitation_hours?.[i] ?? null,
    });
  }

  // Average each month-day across all years
  const result: SyntheticDayData[] = [];

  for (const [monthDay, metricsArray] of dayGroups.entries()) {
    const averaged: DailyMetrics = {} as DailyMetrics;

    // Helper to average non-null values
    const avgField = (field: keyof DailyMetrics): number | null => {
      const values = metricsArray.map(m => m[field]).filter(v => v !== null) as number[];
      return values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : null;
    };

    // Average all metric fields
    averaged.temperature_2m_mean = avgField('temperature_2m_mean');
    averaged.temperature_2m_max = avgField('temperature_2m_max');
    averaged.temperature_2m_min = avgField('temperature_2m_min');
    averaged.apparent_temperature_mean = avgField('apparent_temperature_mean');
    averaged.apparent_temperature_max = avgField('apparent_temperature_max');
    averaged.apparent_temperature_min = avgField('apparent_temperature_min');
    averaged.wind_speed_10m_max = avgField('wind_speed_10m_max');
    averaged.sunshine_duration = avgField('sunshine_duration');
    averaged.cloud_cover_mean = avgField('cloud_cover_mean');
    averaged.dew_point_2m_mean = avgField('dew_point_2m_mean');
    averaged.relative_humidity_2m_mean = avgField('relative_humidity_2m_mean');
    averaged.snowfall_water_equivalent_sum = avgField('snowfall_water_equivalent_sum');
    averaged.soil_moisture_0_to_100cm_mean = avgField('soil_moisture_0_to_100cm_mean');
    averaged.daylight_duration = avgField('daylight_duration');
    averaged.precipitation_sum = avgField('precipitation_sum');
    averaged.rain_sum = avgField('rain_sum');
    averaged.snowfall_sum = avgField('snowfall_sum');
    averaged.precipitation_hours = avgField('precipitation_hours');

    result.push({
      date: `2020-${monthDay}`, // Synthetic year
      metrics: averaged
    });
  }

  // Sort by date to ensure 2020-01-01 through 2020-12-31 order
  result.sort((a, b) => a.date.localeCompare(b.date));

  return result; // Returns 366 rows
}

// ============================================================================
// CSV CONVERSION FUNCTION
// ============================================================================

/**
 * Converts averaged synthetic year data to CSV rows
 * Input: 366 synthetic days (already averaged from multi-year data)
 * Output: 366 CSV rows ready for import
 */
function convertToCSVRows(syntheticData: SyntheticDayData[], city: City, yearRange: string): CSVRow[] {
  const rows: CSVRow[] = [];

  for (const day of syntheticData) {
    const { date, metrics } = day;

    rows.push({
      // City metadata (columns 1-11)
      city: city.name,
      country: city.country,
      state: city.state || '',
      suburb: '',
      date, // Already synthetic: "2020-01-01" through "2020-12-31"
      city_ascii: city.cityAscii || city.name,
      iso2: city.iso2 || '',
      iso3: city.iso3 || '',
      capital: city.capital || '',
      worldcities_id: city.worldcitiesId?.toString() || '',
      data_source: 'worldcities',  // Always worldcities, since city geo data comes from there

      // Existing weather fields (columns 12-50) - empty for Open-Meteo data except mapped fields
      AWND: '',
      DAPR: '',
      DATN: '',
      DATX: '',
      DWPR: '',
      EVAP: '',
      MDPR: '',
      MDTN: '',
      MDTX: '',
      PGTM: '',
      PRCP: metrics.precipitation_sum ?? '',  // Map Open-Meteo precipitation_sum to existing PRCP field
      SN32: '',
      SN52: '',
      SNOW: '',
      SNWD: metrics.snowfall_sum ? (metrics.snowfall_sum * 10) : '',  // Convert cm to mm (×10) and map to existing SNWD field
      SX32: '',
      SX52: '',
      TAVG: metrics.temperature_2m_mean ?? '',  // Map to existing field
      TMAX: metrics.temperature_2m_max ?? '',   // Map to existing field
      TMIN: metrics.temperature_2m_min ?? '',   // Map to existing field
      TOBS: '',
      WDF2: '',
      WDF5: '',
      WDFG: '',
      WDMV: '',
      WESD: '',
      WESF: '',
      WSF2: '',
      WSF5: '',
      WSFG: '',
      WT01: '', WT02: '', WT03: '', WT04: '', WT05: '',
      WT06: '', WT07: '', WT08: '', WT09: '', WT11: '',

      // Location (columns 51-53)
      lat: city.lat,
      long: city.long,
      population: city.population || '',

      // NEW: Station name (column 54)
      name: `${city.name} Open-Meteo ${yearRange}`,  // e.g., "Berlin Open-Meteo 2021-2024"

      // NEW: Open-Meteo fields (columns 55-67)
      apparentTempMean: metrics.apparent_temperature_mean ?? '',
      apparentTempMax: metrics.apparent_temperature_max ?? '',
      apparentTempMin: metrics.apparent_temperature_min ?? '',
      windSpeed10mMax: metrics.wind_speed_10m_max ?? '',
      sunshineDuration: metrics.sunshine_duration ?? '',
      cloudCoverMean: metrics.cloud_cover_mean ?? '',
      dewPoint2mMean: metrics.dew_point_2m_mean ?? '',
      relativeHumidity2mMean: metrics.relative_humidity_2m_mean ?? '',
      snowfallWaterEquivSum: metrics.snowfall_water_equivalent_sum ?? '',
      soilMoisture0to100cmMean: metrics.soil_moisture_0_to_100cm_mean ?? '',
      daylightDuration: metrics.daylight_duration ?? '',
      rainSum: metrics.rain_sum ?? '',
      snowfallSum: metrics.snowfall_sum ?? '',
      precipitationHours: metrics.precipitation_hours ?? ''
    });
  }

  return rows; // Returns 366 rows
}

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

async function fetchOpenMeteoData() {
  console.log('🌤️  Starting Open-Meteo data fetch...\n');

  // 1. Initialize
  const prisma = new PrismaClient();
  const rateLimiter = new RateLimiter();
  const checkpoint = loadCheckpoint();

  // Parse CLI args for testing
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const cityLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  try {
    // 2. Get cities sorted by population
    // IMPORTANT: Fetch ALL eligible cities first, then slice for checkpoint resume
    // This prevents skipping cities when resuming (orderBy + id filter breaks sorting)
    console.log('📊 Fetching cities from database...');
    const allCitiesRaw = await prisma.city.findMany({
      where: { population: { gt: MIN_POPULATION } },
      orderBy: { population: 'desc' },
      select: {
        id: true,
        name: true,
        country: true,
        state: true,
        lat: true,
        long: true,
        population: true,
        cityAscii: true,
        iso2: true,
        iso3: true,
        capital: true,
        worldcitiesId: true
      }
    });

    // Deduplicate cities based on name, state (if available), and country
    // Track which cities have multiple variants (e.g., Tokyo with different subprefectures)
    const cityGroups = new Map<string, City[]>(); // key: "cityName|country", value: all cities with that name
    const seenCities = new Map<string, City>(); // key: "name|state|country", value: first city kept
    const duplicateGroups: DuplicateCityGroup[] = [];

    // Group all cities by name+country to detect duplicates
    for (const city of allCitiesRaw) {
      const groupKey = `${city.name}|${city.country}`;
      if (!cityGroups.has(groupKey)) {
        cityGroups.set(groupKey, []);
      }
      cityGroups.get(groupKey)!.push(city);
    }

    // Filter and track duplicates
    const allCities = allCitiesRaw.filter(city => {
      const key = `${city.name}|${city.state || ''}|${city.country}`;
      if (seenCities.has(key)) {
        return false;
      }
      seenCities.set(key, city);
      return true;
    });

    // Identify city name+country combinations with multiple state variants
    for (const [groupKey, cities] of cityGroups.entries()) {
      const uniqueStates = new Set(cities.map(c => c.state || ''));
      if (uniqueStates.size > 1) {
        // This city has multiple state variants (e.g., Tokyo with blank state + subprefectures)
        const [cityName, country] = groupKey.split('|');
        const keptCities = cities.filter(c => seenCities.has(`${c.name}|${c.state || ''}|${c.country}`));

        // Count unique state variants in kept cities
        const keptStates = new Set(keptCities.map(c => c.state || ''));

        duplicateGroups.push({
          cityName,
          country,
          states: Array.from(uniqueStates),
          totalStations: cities.length,
          uniqueCitiesKept: keptStates.size,
          note: keptStates.size === uniqueStates.size
            ? `All ${keptStates.size} state variants kept as separate cities (correct for different locations)`
            : `Only ${keptStates.size} of ${uniqueStates.size} state variants will be fetched (${cities.length} total stations)`,
          keptStations: keptCities.map(c => ({
            id: c.id,
            state: c.state,
            lat: c.lat,
            long: c.long
          }))
        });
      }
    }

    // Save duplicate cities log
    if (duplicateGroups.length > 0) {
      fs.mkdirSync(path.dirname(DUPLICATE_CITIES_PATH), { recursive: true });
      fs.writeFileSync(DUPLICATE_CITIES_PATH, JSON.stringify(duplicateGroups, null, 2));
      console.log(`⚠️  Found ${duplicateGroups.length} cities with multiple state variants (logged to duplicate_cities.json)`);
    }

    console.log(`Found ${allCities.length} unique cities with population > ${MIN_POPULATION.toLocaleString()}`);

    // Find checkpoint index
    const checkpointIndex = checkpoint.lastCityId
      ? allCities.findIndex(c => c.id === checkpoint.lastCityId)
      : -1;

    if (checkpointIndex >= 0) {
      console.log(`📍 Resuming from checkpoint: city ${checkpoint.lastCityId} (batch ${checkpoint.batchNumber})`);
    }

    // Resume from next city after checkpoint
    let citiesToProcess = checkpointIndex >= 0
      ? allCities.slice(checkpointIndex + 1)
      : allCities;

    // Apply limit if specified
    if (cityLimit) {
      citiesToProcess = citiesToProcess.slice(0, cityLimit);
      console.log(`🔬 Testing mode: Processing ${cityLimit} cities only\n`);
    }

    const cities = citiesToProcess;

    if (cities.length === 0) {
      console.log('✓ All cities already processed!');
      return;
    }

    console.log(`\n🚀 Processing ${cities.length} cities...`);
    console.log(`📦 Batch size: ${BATCH_SIZE} cities per CSV file`);
    console.log(`💾 Checkpoint interval: every ${CHECKPOINT_INTERVAL} cities\n`);

    // 3. Process cities with stream writing
    let batchNumber = checkpoint.batchNumber;
    let citiesProcessedInBatch = 0;
    let totalCitiesProcessed = checkpoint.totalCities;
    let totalRecordsGenerated = checkpoint.totalRecords;
    let csvWriter = createBatchWriter(batchNumber);

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const progress = `[${i + 1}/${cities.length}]`;

      // ===== Fetch recent years (2021-2024) =====
      await rateLimiter.waitIfNeeded();
      try {
        const url = buildOpenMeteoURL(city.lat, city.long, '2021-01-01', '2024-12-31');
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as OpenMeteoResponse;

        // Average 4 years (1,461 days) into synthetic year (366 days)
        const syntheticYear = averageMultiYearToSyntheticYear(data);
        const rows = convertToCSVRows(syntheticYear, city, '2021-2024');

        for (const row of rows) {
          csvWriter.write(row);
        }

        totalRecordsGenerated += rows.length;
        console.log(`${progress} ✓ ${city.name}, ${city.country} - 2021-2024 (${data.daily.time.length} days → ${rows.length} synthetic)`);
      } catch (error: any) {
        console.error(`${progress} ✗ Failed: ${city.name} - 2021-2024:`, error.message);
        logFailedCity(city, '2021-2024', error);
      }

      // ===== Fetch historical years (2010-2015) =====
      await rateLimiter.waitIfNeeded();
      try {
        const url = buildOpenMeteoURL(city.lat, city.long, '2010-01-01', '2015-12-31');
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as OpenMeteoResponse;

        // Average 6 years (2,191 days) into synthetic year (366 days)
        const syntheticYear = averageMultiYearToSyntheticYear(data);
        const rows = convertToCSVRows(syntheticYear, city, '2010-2015');

        for (const row of rows) {
          csvWriter.write(row);
        }

        totalRecordsGenerated += rows.length;
        console.log(`${progress} ✓ ${city.name}, ${city.country} - 2010-2015 (${data.daily.time.length} days → ${rows.length} synthetic)`);
      } catch (error: any) {
        console.error(`${progress} ✗ Failed: ${city.name} - 2010-2015:`, error.message);
        logFailedCity(city, '2010-2015', error);
      }

      citiesProcessedInBatch++;
      totalCitiesProcessed++;

      // Checkpoint every N cities
      if (citiesProcessedInBatch % CHECKPOINT_INTERVAL === 0) {
        const newCheckpoint: Checkpoint = {
          lastCityId: city.id,
          batchNumber,
          totalCities: totalCitiesProcessed,
          totalRecords: totalRecordsGenerated,
          timestamp: new Date().toISOString()
        };
        saveCheckpoint(newCheckpoint);
        const status = rateLimiter.getStatus();
        console.log(`💾 Checkpoint saved at city ${city.id} | Batch ${batchNumber} | Records: ${totalRecordsGenerated.toLocaleString()} | Rate limit: ${status.minute}/min, ${status.hour}/hr, ${status.day}/day\n`);
      }

      // Start new CSV file every BATCH_SIZE cities
      if (citiesProcessedInBatch >= BATCH_SIZE) {
        await csvWriter.end();
        console.log(`📦 Completed batch ${batchNumber}: ${citiesProcessedInBatch} cities (${citiesProcessedInBatch * 732} rows)\n`);
        citiesProcessedInBatch = 0;
        batchNumber++;
        csvWriter = createBatchWriter(batchNumber);
      }
    }

    // Close final CSV file
    if (citiesProcessedInBatch > 0) {
      await csvWriter.end();
      console.log(`📦 Completed final batch ${batchNumber}: ${citiesProcessedInBatch} cities (${citiesProcessedInBatch * 732} rows)\n`);
    }

    // Save final checkpoint
    const finalCheckpoint: Checkpoint = {
      lastCityId: cities[cities.length - 1].id,
      batchNumber,
      totalCities: totalCitiesProcessed,
      totalRecords: totalRecordsGenerated,
      timestamp: new Date().toISOString()
    };
    saveCheckpoint(finalCheckpoint);

    console.log('\n✅ Fetch complete!');
    console.log(`📊 Total cities processed: ${totalCitiesProcessed.toLocaleString()}`);
    console.log(`📝 Total CSV records generated: ${totalRecordsGenerated.toLocaleString()}`);
    console.log(`📦 Total batches: ${batchNumber}`);

    // Check for failures
    if (fs.existsSync(FAILED_CITIES_PATH)) {
      const failedData = fs.readFileSync(FAILED_CITIES_PATH, 'utf-8');
      const failures = JSON.parse(failedData);
      if (failures.length > 0) {
        console.log(`\n⚠️  ${failures.length} API calls failed. Check ${FAILED_CITIES_PATH} for details.`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  try {
    await fetchOpenMeteoData();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
