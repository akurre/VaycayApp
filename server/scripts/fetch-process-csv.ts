import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface City {
  id: number;
  name: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  population: number | null;
}

interface Checkpoint {
  lastCityId: number | null;
  totalCities: number;
  totalRequests: number;
  timestamp: string;
}

interface FailedFetch {
  cityId: number;
  cityName: string;
  yearRange: string;
  error: string;
  timestamp: string;
}

interface CityMetadata {
  cityId: number;
  cityName: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  population: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECKPOINT_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/raw/fetch_progress.json');
const FAILED_FETCHES_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/raw/failed_fetches.json');
const OUTPUT_DIR = path.join(__dirname, '../../dataAndUtils/openMeteoData/raw');
const METADATA_PATH = path.join(__dirname, '../../dataAndUtils/openMeteoData/raw/cities_metadata.json');
const CHECKPOINT_INTERVAL = 25; // save checkpoint every N cities
const BATCH_SIZE = 50; // cities per CSV file (keeps files under 30MB)
const MIN_POPULATION = 100000;

// Year ranges to fetch
const YEAR_RANGES = [
  { name: '2021-2024', start: '2021-01-01', end: '2024-12-31' },
  { name: '2010-2015', start: '2010-01-01', end: '2015-12-31' }
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
  private requestsPerMinute = 10;
  private requestsPerHour = 400;
  private requestsPerDay = 5000;
  private minDelayBetweenRequests = 30000; // 30 seconds base delay
  private lastRequestTime = 0;
  private consecutiveFailures = 0; // Track consecutive 429 errors for exponential backoff
  private currentBackoffMultiplier = 1; // Starts at 1x, increases on failures

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

    // Apply exponential backoff if we've had recent failures
    const effectiveDelay = this.minDelayBetweenRequests * this.currentBackoffMultiplier;

    // Enforce minimum delay (with backoff multiplier)
    if (this.lastRequestTime > 0) {
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < effectiveDelay) {
        const additionalDelay = effectiveDelay - timeSinceLastRequest;
        const backoffNote = this.currentBackoffMultiplier > 1
          ? ` (${this.currentBackoffMultiplier}x backoff after ${this.consecutiveFailures} failures)`
          : '';
        console.log(`⏱️  Enforcing ${Math.ceil(additionalDelay / 1000)}s delay${backoffNote}...`);
        await new Promise(resolve => setTimeout(resolve, additionalDelay));
      }
    }

    // Clean old timestamps
    const currentTime = Date.now();
    this.cleanWindow(this.minuteWindow, currentTime);
    this.cleanWindow(this.hourWindow, currentTime);
    this.cleanWindow(this.dayWindow, currentTime);

    // Check if we need to wait
    const waitTime = this.getOptimalWaitTime(currentTime);
    if (waitTime > 0) {
      const windowName = this.getBlockingWindow(currentTime);
      console.log(`⏳ Rate limit reached (${windowName}), waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));

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

  private getOptimalWaitTime(now: number): number {
    const delays = [
      this.calculateDelay(this.minuteWindow, now),
      this.calculateDelay(this.hourWindow, now),
      this.calculateDelay(this.dayWindow, now)
    ];
    return Math.max(...delays);
  }

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

  /**
   * Call this when a request succeeds - resets backoff
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.currentBackoffMultiplier = 1;
  }

  /**
   * Call this when a 429 error occurs - increases backoff
   * Backoff progression: 1x → 2x → 4x → 8x → 16x → 32x → 64x → 128x → 240x (max = 2 hours)
   * At 30s base: 30s → 1m → 2m → 4m → 8m → 16m → 32m → 64m → 120m (2h max)
   */
  record429Error(): void {
    this.consecutiveFailures++;
    // Exponential up to 128x, then cap at 240x (2 hours with 30s base)
    const exponential = Math.pow(2, Math.min(7, this.consecutiveFailures)); // Up to 2^7 = 128x
    this.currentBackoffMultiplier = Math.min(240, exponential);
    const delayMinutes = (this.minDelayBetweenRequests * this.currentBackoffMultiplier / 60000).toFixed(1);
    console.log(`🔴 Rate limit hit! Failure #${this.consecutiveFailures} → ${this.currentBackoffMultiplier}x backoff (${delayMinutes} min delay)`);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    const data = fs.readFileSync(CHECKPOINT_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return {
    lastCityId: null,
    totalCities: 0,
    totalRequests: 0,
    timestamp: new Date().toISOString()
  };
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  fs.mkdirSync(path.dirname(CHECKPOINT_PATH), { recursive: true });
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2));
}

function logFailedFetch(city: City, yearRange: string, error: any): void {
  const failure: FailedFetch = {
    cityId: city.id,
    cityName: `${city.name}, ${city.country}`,
    yearRange,
    error: error.message || String(error),
    timestamp: new Date().toISOString()
  };

  let failures: FailedFetch[] = [];
  if (fs.existsSync(FAILED_FETCHES_PATH)) {
    const data = fs.readFileSync(FAILED_FETCHES_PATH, 'utf-8');
    failures = JSON.parse(data);
  }

  failures.push(failure);
  fs.mkdirSync(path.dirname(FAILED_FETCHES_PATH), { recursive: true });
  fs.writeFileSync(FAILED_FETCHES_PATH, JSON.stringify(failures, null, 2));
}

async function fetchWithRetry(url: string, rateLimiter: RateLimiter): Promise<Response> {
  let attempt = 0;
  const maxNetworkRetries = 5; // Only for network errors, NOT for 429s

  while (true) { // Infinite retry loop for 429 errors
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited - tell rate limiter to increase backoff
        rateLimiter.record429Error();

        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : 60000; // Wait 60s by default on 429

        console.log(`⚠️  Rate limited (429). Waiting ${Math.ceil(waitTime / 1000)}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Keep retrying forever on 429
      }

      // Success! Reset backoff
      if (response.ok) {
        rateLimiter.recordSuccess();
      }

      return response;
    } catch (error: any) {
      // Network error - retry with exponential backoff, but give up after maxNetworkRetries
      attempt++;
      if (attempt >= maxNetworkRetries) {
        throw error;
      }
      const waitTime = 5000 * Math.pow(2, attempt - 1);
      console.log(`⚠️  Network error: ${error.message}. Retrying in ${waitTime / 1000}s (attempt ${attempt}/${maxNetworkRetries})...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

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

// ============================================================================
// MAIN FETCH FUNCTION
// ============================================================================

async function fetchOpenMeteoRaw() {
  console.log('🌤️  Starting Open-Meteo RAW data fetch...\n');

  const prisma = new PrismaClient();
  const rateLimiter = new RateLimiter();
  const checkpoint = loadCheckpoint();

  // Parse CLI args
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const cityLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  try {
    // Fetch all cities
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
        population: true
      }
    });

    // Deduplicate by name|state|country
    const seenCities = new Map<string, City>();
    const allCities = allCitiesRaw.filter(city => {
      const key = `${city.name}|${city.state || ''}|${city.country}`;
      if (seenCities.has(key)) {
        return false;
      }
      seenCities.set(key, city);
      return true;
    });

    console.log(`Found ${allCities.length} unique cities with population > ${MIN_POPULATION.toLocaleString()}`);

    // Resume from checkpoint
    const checkpointIndex = checkpoint.lastCityId
      ? allCities.findIndex(c => c.id === checkpoint.lastCityId)
      : -1;

    if (checkpointIndex >= 0) {
      console.log(`📍 Resuming from checkpoint: city ${checkpoint.lastCityId}`);
    }

    let citiesToProcess = checkpointIndex >= 0
      ? allCities.slice(checkpointIndex + 1)
      : allCities;

    if (cityLimit) {
      citiesToProcess = citiesToProcess.slice(0, cityLimit);
      console.log(`🔬 Testing mode: Processing ${cityLimit} cities only\n`);
    }

    if (citiesToProcess.length === 0) {
      console.log('✓ All cities already processed!');
      return;
    }

    console.log(`\n🚀 Processing ${citiesToProcess.length} cities...`);
    console.log(`💾 Checkpoint interval: every ${CHECKPOINT_INTERVAL} cities\n`);

    // Create output directory
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Save city metadata
    const cityMetadata: CityMetadata[] = citiesToProcess.map(c => ({
      cityId: c.id,
      cityName: c.name,
      country: c.country,
      state: c.state,
      lat: c.lat,
      long: c.long,
      population: c.population
    }));
    fs.writeFileSync(METADATA_PATH, JSON.stringify(cityMetadata, null, 2));

    let totalCitiesProcessed = checkpoint.totalCities;
    let totalRequestsMade = checkpoint.totalRequests;
    let currentBatchNumber = Math.floor(totalCitiesProcessed / BATCH_SIZE) + 1;
    let citiesInCurrentBatch = totalCitiesProcessed % BATCH_SIZE;

    for (let i = 0; i < citiesToProcess.length; i++) {
      const city = citiesToProcess[i];
      const progress = `[${i + 1}/${citiesToProcess.length}]`;

      // Check if we need to start a new batch
      if (citiesInCurrentBatch >= BATCH_SIZE) {
        currentBatchNumber++;
        citiesInCurrentBatch = 0;
        console.log(`\n📦 Starting batch ${currentBatchNumber}\n`);
      }

      // Fetch each year range
      for (const yearRange of YEAR_RANGES) {
        await rateLimiter.waitIfNeeded();

        try {
          const url = buildOpenMeteoURL(city.lat, city.long, yearRange.start, yearRange.end);
          const response = await fetchWithRetry(url, rateLimiter);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json() as any;

          // Convert to CSV rows immediately (save raw data, no averaging)
          const csvRows: any[] = [];
          const numDays = data.daily?.time?.length || 0;

          for (let i = 0; i < numDays; i++) {
            csvRows.push({
              city_id: city.id,
              city_name: city.name,
              country: city.country,
              state: city.state || '',
              lat: city.lat,
              long: city.long,
              population: city.population || '',
              year_range: yearRange.name,
              date: data.daily.time[i],
              temperature_2m_mean: data.daily.temperature_2m_mean?.[i] ?? '',
              temperature_2m_max: data.daily.temperature_2m_max?.[i] ?? '',
              temperature_2m_min: data.daily.temperature_2m_min?.[i] ?? '',
              apparent_temperature_mean: data.daily.apparent_temperature_mean?.[i] ?? '',
              apparent_temperature_max: data.daily.apparent_temperature_max?.[i] ?? '',
              apparent_temperature_min: data.daily.apparent_temperature_min?.[i] ?? '',
              wind_speed_10m_max: data.daily.wind_speed_10m_max?.[i] ?? '',
              sunshine_duration: data.daily.sunshine_duration?.[i] ?? '',
              cloud_cover_mean: data.daily.cloud_cover_mean?.[i] ?? '',
              dew_point_2m_mean: data.daily.dew_point_2m_mean?.[i] ?? '',
              relative_humidity_2m_mean: data.daily.relative_humidity_2m_mean?.[i] ?? '',
              snowfall_water_equivalent_sum: data.daily.snowfall_water_equivalent_sum?.[i] ?? '',
              soil_moisture_0_to_100cm_mean: data.daily.soil_moisture_0_to_100cm_mean?.[i] ?? '',
              daylight_duration: data.daily.daylight_duration?.[i] ?? '',
              precipitation_sum: data.daily.precipitation_sum?.[i] ?? '',
              rain_sum: data.daily.rain_sum?.[i] ?? '',
              snowfall_sum: data.daily.snowfall_sum?.[i] ?? '',
              precipitation_hours: data.daily.precipitation_hours?.[i] ?? ''
            });
          }

          // Append to batch CSV file (with header if first write to this batch)
          const batchCSV = path.join(OUTPUT_DIR, `batch_${currentBatchNumber}.csv`);
          const isFirstWrite = !fs.existsSync(batchCSV);
          const csvContent = stringify(csvRows, { header: isFirstWrite });
          fs.appendFileSync(batchCSV, csvContent);

          totalRequestsMade++;
          console.log(`${progress} ✓ ${city.name}, ${city.country} - ${yearRange.name} (${numDays} days → batch ${currentBatchNumber})`);
        } catch (error: any) {
          console.error(`${progress} ✗ Failed: ${city.name} - ${yearRange.name}:`, error.message);
          logFailedFetch(city, yearRange.name, error);
        }
      }

      totalCitiesProcessed++;
      citiesInCurrentBatch++;

      // Save checkpoint
      if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
        const newCheckpoint: Checkpoint = {
          lastCityId: city.id,
          totalCities: totalCitiesProcessed,
          totalRequests: totalRequestsMade,
          timestamp: new Date().toISOString()
        };
        saveCheckpoint(newCheckpoint);
        const status = rateLimiter.getStatus();
        console.log(`💾 Checkpoint saved | Cities: ${totalCitiesProcessed} | Requests: ${totalRequestsMade} | Rate: ${status.minute}/min, ${status.hour}/hr\n`);
      }
    }

    // Save final checkpoint
    const finalCheckpoint: Checkpoint = {
      lastCityId: citiesToProcess[citiesToProcess.length - 1].id,
      totalCities: totalCitiesProcessed,
      totalRequests: totalRequestsMade,
      timestamp: new Date().toISOString()
    };
    saveCheckpoint(finalCheckpoint);

    console.log('\n✅ Fetch complete!');
    console.log(`📊 Total cities processed: ${totalCitiesProcessed.toLocaleString()}`);
    console.log(`📝 Total requests made: ${totalRequestsMade.toLocaleString()}`);
    console.log(`📦 Total batches: ${currentBatchNumber}`);
    console.log(`📁 CSV files saved to: ${OUTPUT_DIR}/batch_*.csv`);

    // Check for failures
    if (fs.existsSync(FAILED_FETCHES_PATH)) {
      const failedData = fs.readFileSync(FAILED_FETCHES_PATH, 'utf-8');
      const failures = JSON.parse(failedData);
      if (failures.length > 0) {
        console.log(`\n⚠️  ${failures.length} API calls failed. Check ${FAILED_FETCHES_PATH} for details.`);
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
    await fetchOpenMeteoRaw();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
