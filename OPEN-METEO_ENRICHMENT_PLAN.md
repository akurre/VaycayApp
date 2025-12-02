# Open-Meteo Weather Data Enrichment Plan

## Overview
Enrich the existing weather database (2016-2020 data) with additional historical data from Open-Meteo Archive API to improve the quality and depth of weather averages.

**Current State:**
- Database has weather records from 2016-2020 for ~41,000 cities
- Data includes basic metrics: temperature, precipitation, snow, wind
- Cloud cover is calculated theoretically (not from real data)
- Sunshine duration data only available for ~300 cities
- Weekly aggregations compute averages across all available data
- **Multi-station issue**: Cities with multiple weather stations currently render overlapping markers (fixed separately)

**Desired State:**
- Real cloud cover and sunshine duration data 
- Additional metrics: humidity, dew point, apparent temperature, soil moisture
- Improved averages with 3x more data points
- Priority on large cities (population > 100k)

**Final Architecture:**
- **Backend**: Store TWO Open-Meteo data ranges as separate stations per city:
  - Station 1: `"{CityName} Open-Meteo 2021-2024"` (4 years averaged into 366 synthetic days)
  - Station 2: `"{CityName} Open-Meteo 2010-2015"` (6 years averaged into 366 synthetic days)
- **2 additional stations per city**: One for recent years (2021-2024), one for historical years (2010-2015)
- **Multi-year averaging**: Each API call fetches multiple years (e.g., 2021-2024 = 1,461 days), which gets averaged into 366 synthetic days BEFORE storing in database
- **Synthetic year dates**: All data stored using 2020 dates (2020-01-01 to 2020-12-31) for consistency with existing data
- **Total new records per city**: 732 records (2 stations × 366 days)
- **Frontend consolidation**: Frontend averages all stations (existing + Open-Meteo) before map display
- **Backend aggregation**: Weekly aggregation script automatically includes all stations
- **Result**: ONE marker per city on map, vastly improved weekly averages using 3x more data points (15 years vs 5 years)

## Goals
1. Add data from 2021-2024 (PRIORITY) and 2010-2015 (secondary)
2. Introduce new weather metrics not currently available (cloud cover, sunshine duration, humidity, etc.)
3. Improve averaging accuracy by expanding the sample size
4. Create a resilient two-phase approach: API fetch → CSV → Database import

## Background Context

### Frontend Multi-Station Handling (PREREQUISITE - ✅ COMPLETED)

**IMPORTANT:** Frontend consolidation has been implemented to handle multiple weather stations per city.

**The Problem:**
- GraphQL API returns separate records for each weather station per city (same `cityId`, different `stationId`)
- Berlin (cityId 1223) with 2 stations returns 2 separate `WeatherData` objects (this behavior is unchanged)
- Frontend was rendering each as a separate marker at identical coordinates (overlapping)
- Users only saw arbitrary single-station data (whichever rendered last)

**What Was Fixed:**
- Frontend now consolidates multiple station records before rendering
- GraphQL API behavior unchanged (still returns all station records separately)

**Implementation (Completed):**
- Added `cityId` field to GraphQL schema and all weather/sunshine types
- Updated ALL GraphQL queries (6 queries) to request `cityId` field
- Created consolidation utilities:
  - `consolidateWeatherByCity()` - Groups by `cityId`, averages temps/precip/snow
  - `consolidateSunshineByCity()` - Groups by `cityId`, averages monthly sunshine
- Integrated in `client/src/pages/map.tsx` (lines 122-123)
- Station name indicates consolidation:
  - Before Open-Meteo: `"Berlin (2 stations avg)"`
  - After Open-Meteo: `"Berlin (4 stations avg)"`

**Known Limitation:**
- Home location marker uses single-city queries that return ONE record (first station only)
- When home city is visible on map (within viewport), consolidated data shows correctly
- Home marker when out of bounds shows single-station data

**Impact for Open-Meteo Plan:**
- ✅ Adding 2 Open-Meteo stations per city (2021-2024 and 2010-2015) will NOT create overlapping markers
- ✅ All stations (existing + 2 Open-Meteo) automatically averaged by `cityId` on frontend
- ✅ Performance: Consolidation on ~300-600 records takes <1ms (negligible)
- ✅ Map always renders ONE marker per city regardless of number of backend stations
- ✅ Example: Berlin with 2 existing stations + 2 Open-Meteo stations = 4 total stations → 1 marker showing average of all 4

### Open-Meteo Archive API
- **Endpoint:** `https://archive-api.open-meteo.com/v1/archive`
- **Free tier:** Yes (CC-BY 4.0 license, non-commercial use)
- **Historical data:** 1940 to present (7 days delay)
- **Parameters:** latitude, longitude, start_date, end_date, daily metrics
- **Format:** JSON with parallel arrays for each date/metric

**Example Request:**
```
https://archive-api.open-meteo.com/v1/archive?latitude=52.5167&longitude=13.3833&start_date=2024-01-01&end_date=2024-12-31&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,apparent_temperature_mean,apparent_temperature_max,apparent_temperature_min,wind_speed_10m_max,sunshine_duration,cloud_cover_mean,dew_point_2m_mean,relative_humidity_2m_mean,snowfall_water_equivalent_sum,soil_moisture_0_to_100cm_mean,daylight_duration,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours
```

**Example Response Structure:**
```json
{
  "latitude": 52.54833,
  "longitude": 13.407822,
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_mean": "°C",
    "sunshine_duration": "s",
    "cloud_cover_mean": "%",
    ...
  },
  "daily": {
    "time": ["2024-01-01", "2024-01-02", ...],
    "temperature_2m_mean": [9.61, 10.75, ...],
    "cloud_cover_mean": [85.0, 92.0, ...],
    ...
  }
}
```

## Key Constraints

### API Rate Limits (Open-Meteo Free Tier)
- **10,000 API calls per day**
- **5,000 per hour**
- **600 per minute**
- Non-commercial use only
- CC-BY 4.0 license

### Current System Context
- ~41,000 cities in worldcities.csv
- Current data: 7.5M weather records (2016-2020, but all combined in synthetic year 2020)
- 64+ existing CSV batch files in `dataAndUtils/worldData_v2/`
- Existing CSV format has ~53 fields including city metadata and weather metrics
- Import time: 30-60 minutes for full dataset
- WeatherRecord table has limited fields (PRCP, SNWD, TAVG, TMAX, TMIN, AWND, etc.)

### Coordinate Matching
- Coordinates may not match exactly between database and API response
- Example: Berlin DB (52.5167°, 13.3833°) vs API (52.54833, 13.407822)
- Open-Meteo API is flexible and accepts DB coordinates directly
- Solution: Use existing database lat/long for API calls; API will provide data for nearest location

---

## Phase 1: Database Schema Migration

### New Fields for WeatherRecord Table

**Location:** `server/prisma/schema.prisma`

Add the following columns to support Open-Meteo data:

**IMPORTANT:** All new fields must be optional (`Float?`) to maintain backward compatibility with existing records.

**CORE METRICS MAPPING STRATEGY:**

For automatic averaging across all data sources (existing + Open-Meteo), we map Open-Meteo data to populate existing fields:

**Temperature Fields (existing → populated by both sources):**
- `TAVG` (Float?) - Existing field, populated by:
  - Existing data: Original TAVG values
  - Open-Meteo: `temperature_2m_mean` (°C)
- `TMAX` (Float?) - Existing field, populated by:
  - Existing data: Original TMAX values
  - Open-Meteo: `temperature_2m_max` (°C)
- `TMIN` (Float?) - Existing field, populated by:
  - Existing data: Original TMIN values
  - Open-Meteo: `temperature_2m_min` (°C)

**Note:** The "2m" designation indicates air temperature measured at 2 meters above the surface (land, sea, or inland waters). This is the standard meteorological measurement height for surface temperature observations, ensuring consistency across different weather stations and data sources.

**NEW Apparent Temperature Fields:**
- `apparentTempMean` (Float?) - maps to `apparent_temperature_mean`
- `apparentTempMax` (Float?) - maps to `apparent_temperature_max`
- `apparentTempMin` (Float?) - maps to `apparent_temperature_min`

**NEW Wind Field:**
- `windSpeed10mMax` (Float?) - maps to `wind_speed_10m_max` (km/h)

**NEW Sunshine & Cloud Cover (HIGH PRIORITY):**
- `sunshineDuration` (Float?) - maps to `sunshine_duration` (seconds)
- `cloudCoverMean` (Float?) - maps to `cloud_cover_mean` (%)

**NEW Humidity & Dew Point:**
- `dewPoint2mMean` (Float?) - maps to `dew_point_2m_mean` (°C) - measured at 2m height
- `relativeHumidity2mMean` (Float?) - maps to `relative_humidity_2m_mean` (%) - measured at 2m height

**NEW Snow & Soil:**
- `snowfallWaterEquivSum` (Float?) - maps to `snowfall_water_equivalent_sum` (mm)
- `soilMoisture0to100cmMean` (Float?) - maps to `soil_moisture_0_to_100cm_mean` (m³/m³)

**NEW Daylight:**
- `daylightDuration` (Float?) - maps to `daylight_duration` (seconds)

**Precipitation & Snow Mapping Strategy:**

Open-Meteo data will populate BOTH existing fields (for automatic averaging) AND new fields (for additional detail):

**Existing Fields (for automatic averaging):**
- `PRCP` (Float?) - Existing field, populated by:
  - Existing data: Original PRCP values
  - Open-Meteo: `precipitation_sum` (mm) - total precipitation
- `SNWD` (Float?) - Existing field (mm), populated by:
  - Existing data: Original SNWD values
  - Open-Meteo: `snowfall_sum` (cm) **converted to mm** (multiply by 10)

**NEW Detail Fields (Open-Meteo only):**
- `rainSum` (Float?) - maps to `rain_sum` (mm) - liquid rain only
- `snowfallSum` (Float?) - maps to `snowfall_sum` (cm) - raw snow measurement
- `precipitationHours` (Float?) - maps to `precipitation_hours` (h)

**Why this approach:**
- Existing records and Open-Meteo records populate same PRCP/SNWD fields
- Frontend consolidation and weekly aggregations automatically average across all data sources
- Result: 3x more accurate precipitation and snow depth averages (20 years vs 5 years)
- New detail fields provide additional granularity for future analysis

**SUMMARY: Automatic Averaging Benefit**

By mapping Open-Meteo data to existing fields (TAVG/TMAX/TMIN, PRCP, SNWD), all core weather metrics are automatically averaged across ALL stations:
- **Temperature**: 4 stations × 366 days = improved averages from 20 years of data
- **Precipitation**: 4 stations × 366 days = improved averages from 20 years of data
- **Snow Depth**: 4 stations × 366 days = improved averages from 20 years of data

No code changes needed in frontend consolidation or weekly aggregation logic - it just works! ✨

### Exact Schema Changes

**Add new weather metric fields only - no structural changes needed!**

In the `WeatherRecord` model:

```prisma
model WeatherRecord {
  id         Int      @id @default(autoincrement())
  cityId     Int
  stationId  Int      // Stays non-nullable - Open-Meteo gets dummy station
  date       String   // Format: YYYY-MM-DD

  // Existing fields (keep as-is)
  PRCP      Float?
  SNWD      Float?
  TAVG      Float?
  TMAX      Float?
  TMIN      Float?
  AWND      Float?  // Already in km/h - matches Open-Meteo wind_speed_10m_max
  DAPR      Float?
  DATN      Float?
  DATX      Float?
  DWPR      Float?
  MDPR      Float?
  MDTN      Float?
  MDTX      Float?
  WDF2      Float?
  WDF5      Float?
  WSF2      Float?
  WSF5      Float?

  // NEW: Open-Meteo fields
  apparentTempMean         Float?
  apparentTempMax          Float?
  apparentTempMin          Float?
  windSpeed10mMax          Float?  // km/h - same unit as AWND
  sunshineDuration         Float?  // seconds
  cloudCoverMean           Float?  // percentage
  dewPoint2mMean           Float?  // °C
  relativeHumidity2mMean   Float?  // percentage
  snowfallWaterEquivSum    Float?  // mm
  soilMoisture0to100cmMean Float?  // m³/m³ - indicates biome "greenness"
  daylightDuration         Float?  // seconds
  rainSum                  Float?  // mm
  snowfallSum              Float?  // cm
  precipitationHours       Float?  // hours

  // Relations
  city    City           @relation(fields: [cityId], references: [id], onDelete: Cascade)
  station WeatherStation @relation(fields: [stationId], references: [id], onDelete: Cascade)

  @@unique([cityId, stationId, date])
  @@index([date])
  @@index([cityId, date])
  @@map("weather_records")
}
```

### Prisma Migration Steps

Execute these commands in the `server/` directory:

```bash
# 1. Update schema.prisma with the fields above

# 2. Create and apply migration
npx prisma migrate dev --name add_open_meteo_fields

# 3. Generate Prisma client
npx prisma generate

# 4. Verify migration was created
ls -la prisma/migrations/
```

---

## Phase 2: Data Fetching Script

### Script: `server/scripts/fetch-open-meteo-data.ts`

**Purpose:** Fetch historical weather data from Open-Meteo Archive API and save as CSV files.

**Key Requirements:**
1. Connect to database to get city list with lat/long
2. Prioritize by population (largest first)
3. Respect API rate limits with sliding window tracking
4. Save progress checkpoints every 100 cities
5. Generate CSV files matching existing batch format
6. Handle errors gracefully and log failures
7. Support resume functionality

### City Prioritization Strategy

1. Query database for all cities with `population` data
2. Sort by population (descending) - largest cities first
3. Filter to include cities with population > 100,000 (adjustable threshold)
4. Estimated: ~3,000-5,000 major cities (vs 41,000 total)

### Year Ranges to Fetch

Open-Meteo Archive API supports multi-year date ranges in a single call.

**Call 1: Recent Years (2021-2024) - PRIORITY**
```
start_date=2021-01-01&end_date=2024-12-31
```
- Returns 1,461 days of data (4 years) in one API call
- **MUST be averaged to 366 synthetic days before storing**
- Single API call per city
- Creates station: `"{CityName} Open-Meteo 2021-2024"`
- Priority data for improving recent averages

**Call 2: Historical Years (2010-2015)**
```
start_date=2010-01-01&end_date=2015-12-31
```
- Returns 2,191 days of data (6 years) in one API call
- **MUST be averaged to 366 synthetic days before storing**
- Single API call per city
- Creates station: `"{CityName} Open-Meteo 2010-2015"`
- Extends historical depth

**Total API calls estimate:**
- 4,000 cities × 2 calls = **8,000 API calls total**
- Well within daily limit of 10,000 calls
- **Can complete entire fetch in under 1 day!** 🚀

**Storage estimate:**
- 4,000 cities × 2 stations × 366 days = **2,928,000 new records**
- Each record stores averaged values across multiple years

### Rate Limiting Implementation

**Optimized Rate Limiter with Predictive Timing:**
- Predicts when each window will reset
- Minimizes waiting time to avoid IP blocks
- Provides detailed status for monitoring

```typescript
interface RateLimitWindow {
  timestamps: number[];
  limit: number;
  windowMs: number;
}

class RateLimiter {
  private requestsPerMinute = 500; // 600 limit, use 500 for safety
  private requestsPerHour = 4500;   // 5000 limit, use 4500 for safety
  private requestsPerDay = 9500;    // 10000 limit, use 9500 for safety

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

    // Clean old timestamps outside windows
    this.cleanWindow(this.minuteWindow, now);
    this.cleanWindow(this.hourWindow, now);
    this.cleanWindow(this.dayWindow, now);

    // Get optimal wait time (predictive)
    const waitTime = this.getOptimalWaitTime(now);

    if (waitTime > 0) {
      const windowName = this.getBlockingWindow(now);
      console.log(`Rate limit reached (${windowName}), waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 100));

      // Clean again after waiting
      this.cleanWindow(this.minuteWindow, Date.now());
      this.cleanWindow(this.hourWindow, Date.now());
      this.cleanWindow(this.dayWindow, Date.now());
    }

    // Record this request
    const requestTime = Date.now();
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
```

### Batch Processing & Resilience

1. **Stream Writing & Checkpointing:**
   - Stream write CSV rows immediately (no memory accumulation)
   - **Save checkpoint file every 25 cities** (frequent due to multi-year API responses)
   - **Create new CSV batch file every 50 cities** (each city generates 732 CSV rows = 2 stations × 366 days)
   - Resume from checkpoint if script crashes or is stopped
   - **Critical:** CSV rows already contain averaged synthetic year data (366 days per station, NOT raw multi-year data)


2. **Batch Output Structure:**
   ```
   dataAndUtils/openMeteoData/
   ├── fetch_progress.json
   ├── batch1/
   │   └── batch1_open_meteo_data.csv  (cities 1-100)
   ├── batch2/
   │   └── batch2_open_meteo_data.csv  (cities 101-200)
   └── ...
   ```

3. **Error Handling:**
   - Log failed API calls to `failed_cities.json`
   - Continue processing other cities
   - Retry failed cities at end of run
   - Skip cities with no data (API returns empty)

### CSV Output Format

**Match existing batch format** for compatibility with `import-csv-data.ts`.

**Existing CSV column order (53 fields):**
```csv
city,country,state,suburb,date,city_ascii,iso2,iso3,capital,worldcities_id,data_source,AWND,DAPR,DATN,DATX,DWPR,EVAP,MDPR,MDTN,MDTX,PGTM,PRCP,SN32,SN52,SNOW,SNWD,SX32,SX52,TAVG,TMAX,TMIN,TOBS,WDF2,WDF5,WDFG,WDMV,WESD,WESF,WSF2,WSF5,WSFG,WT01,WT02,WT03,WT04,WT05,WT06,WT07,WT08,WT09,WT11,lat,long,population
```

**New CSV format with Open-Meteo fields added at END (67 fields):**
```csv
city,country,state,suburb,date,city_ascii,iso2,iso3,capital,worldcities_id,data_source,AWND,DAPR,DATN,DATX,DWPR,EVAP,MDPR,MDTN,MDTX,PGTM,PRCP,SN32,SN52,SNOW,SNWD,SX32,SX52,TAVG,TMAX,TMIN,TOBS,WDF2,WDF5,WDFG,WDMV,WESD,WESF,WSF2,WSF5,WSFG,WT01,WT02,WT03,WT04,WT05,WT06,WT07,WT08,WT09,WT11,lat,long,population,name,apparentTempMean,apparentTempMax,apparentTempMin,windSpeed10mMax,sunshineDuration,cloudCoverMean,dewPoint2mMean,relativeHumidity2mMean,snowfallWaterEquivSum,soilMoisture0to100cmMean,daylightDuration,rainSum,snowfallSum,precipitationHours
```

**Key changes:**
- Added `name` field for station name (existing import script expects `row.name`)
- Added 14 new Open-Meteo fields at the END for backward compatibility
- All existing fields remain in the same position
- Empty string `""` for fields not available in Open-Meteo data (e.g., EVAP, SN32, WT01-WT11)

**Important:**
- Set `name` = `"{CityName} Open-Meteo {yearRange}"` (e.g., `"Berlin Open-Meteo 2021-2024"` or `"Berlin Open-Meteo 2010-2015"`)
- Set `data_source` = `"worldcities"` (same as existing records, since city metadata comes from worldcities.csv)

### Multi-Year Averaging Function

Since we fetch multiple years in a single API call (e.g., 2021-2024 = 1,461 days), we must **average them into 366 synthetic days** before creating CSV rows.

**Purpose:** Convert 4 years of daily data (1,461 days) into a single synthetic year (366 days) by averaging all occurrences of each calendar day.

```typescript
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
```

**Usage in fetch script:**
```typescript
// Fetch multi-year data (2021-2024 = 1,461 days)
const apiData = await fetch('...start_date=2021-01-01&end_date=2024-12-31');

// CRITICAL: Average into synthetic year BEFORE storing (1,461 days → 366 days)
const syntheticYear = averageMultiYearToSyntheticYear(apiData);

// Convert to CSV rows (366 rows, NOT 1,461)
const rows = convertToCSVRows(syntheticYear, city, '2021-2024');

// Each row will have station_name = "Berlin Open-Meteo 2021-2024"
// Date will be synthetic year: 2020-01-01 through 2020-12-31
```

### Core Fetch Logic Pseudocode

```typescript
async function fetchOpenMeteoData() {
  // 1. Initialize
  const prisma = new PrismaClient();
  const rateLimiter = new RateLimiter();
  const checkpoint = loadCheckpoint(); // { lastCityId: number, batchNumber: number }

  // Parse CLI args for testing
  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const cityLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  // 2. Get cities sorted by population
  // IMPORTANT: Fetch ALL eligible cities first, then slice for checkpoint resume
  // This prevents skipping cities when resuming (orderBy + id filter breaks sorting)
  const allCities = await prisma.city.findMany({
    where: { population: { gt: 100000 } },
    orderBy: { population: 'desc' },
    select: { id, name, country, state, lat, long, population, /* all fields */ }
  });

  // Find checkpoint index
  const checkpointIndex = checkpoint.lastCityId
    ? allCities.findIndex(c => c.id === checkpoint.lastCityId)
    : -1;

  // Resume from next city after checkpoint
  let citiesToProcess = checkpointIndex >= 0
    ? allCities.slice(checkpointIndex + 1)
    : allCities;

  // Apply limit if specified
  if (cityLimit) {
    citiesToProcess = citiesToProcess.slice(0, cityLimit);
  }

  const cities = citiesToProcess;
  console.log(`Fetching data for ${cities.length} cities`);

  // 3. Process cities with stream writing
  let batchNumber = checkpoint.batchNumber;
  let citiesProcessedInBatch = 0;
  let csvWriter = createBatchWriter(batchNumber);

  for (const city of cities) {
    // Fetch recent years (2021-2024)
    await rateLimiter.waitIfNeeded();
    try {
      const url = buildOpenMeteoURL(city.lat, city.long, '2021-01-01', '2024-12-31');
      const response = await fetch(url);
      const data = await response.json();

      // Average 4 years (1,461 days) into synthetic year (366 days)
      const syntheticYear = averageMultiYearToSyntheticYear(data);
      const rows = convertToCSVRows(syntheticYear, city, '2021-2024');

      for (const row of rows) {
        csvWriter.write(row);
      }

      console.log(`✓ ${city.name}, ${city.country} - 2021-2024 (${data.daily.time.length} days → ${rows.length} synthetic)`);
    } catch (error) {
      console.error(`✗ Failed: ${city.name} - 2021-2024:`, error.message);
      logFailedCity(city, '2021-2024', error);
    }

    // Fetch historical years (2010-2015)
    await rateLimiter.waitIfNeeded();
    try {
      const url = buildOpenMeteoURL(city.lat, city.long, '2010-01-01', '2015-12-31');
      const response = await fetch(url);
      const data = await response.json();

      // Average 6 years (2,191 days) into synthetic year (366 days)
      const syntheticYear = averageMultiYearToSyntheticYear(data);
      const rows = convertToCSVRows(syntheticYear, city, '2010-2015');

      for (const row of rows) {
        csvWriter.write(row);
      }

      console.log(`✓ ${city.name}, ${city.country} - 2010-2015 (${data.daily.time.length} days → ${rows.length} synthetic)`);
    } catch (error) {
      console.error(`✗ Failed: ${city.name} - 2010-2015:`, error.message);
      logFailedCity(city, '2010-2015', error);
    }

    citiesProcessedInBatch++;

    // Checkpoint every 25 cities
    if (citiesProcessedInBatch % 25 === 0) {
      saveCheckpoint({ lastCityId: city.id, batchNumber });
      console.log(`💾 Checkpoint saved at city ${city.id} (${citiesProcessedInBatch * 732} CSV rows written)`);
    }

    // Start new CSV file every 50 cities
    if (citiesProcessedInBatch >= 50) {
      await csvWriter.end();
      console.log(`📦 Completed batch ${batchNumber}: ${citiesProcessedInBatch} cities (${citiesProcessedInBatch * 732} rows)`);
      citiesProcessedInBatch = 0;
      batchNumber++;
      csvWriter = createBatchWriter(batchNumber);
    }
  }

  // Close final CSV file
  await csvWriter.end();
  console.log(`📦 Completed final batch ${batchNumber}: ${citiesProcessedInBatch} cities`);
  console.log('✓ Fetch complete!');
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
      worldcities_id: city.worldcitiesId || '',
      data_source: 'worldcities',  // Always worldcities, since city geo data comes from there

      // Existing weather fields (columns 12-50) - empty for Open-Meteo data
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

function createBatchWriter(batchNumber: number) {
  const batchDir = `dataAndUtils/openMeteoData/batch${batchNumber}`;
  fs.mkdirSync(batchDir, { recursive: true });

  const csvPath = `${batchDir}/batch${batchNumber}_open_meteo_data.csv`;
  const writeStream = fs.createWriteStream(csvPath);
  const stringifier = stringify({ header: true, columns: CSV_COLUMNS });

  stringifier.pipe(writeStream);
  return stringifier;
}
```

### Script Structure

**File: `server/scripts/fetch-open-meteo-data.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Type definitions
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    temperature_2m_mean?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    // ... all other fields
  };
}

interface CSVRow {
  city: string;
  country: string;
  // ... all CSV columns
}

interface Checkpoint {
  lastCityId: number;
  batchNumber: number;
  totalRecords: number;
  failedCities: Array<{ cityId: number; cityName: string; year: number; error: string }>;
}

// Constants
const CHECKPOINT_PATH = 'dataAndUtils/openMeteoData/fetch_progress.json';
const FAILED_CITIES_PATH = 'dataAndUtils/openMeteoData/failed_cities.json';
const BATCH_SIZE = 100; // cities per batch
const MIN_POPULATION = 100000;
const PRIORITY_YEARS = [2024, 2023, 2022, 2021]; // Priority 1
const SECONDARY_YEARS = [2015, 2014, 2013, 2012, 2011, 2010]; // Priority 2

// Main function
async function main() {
  const prisma = new PrismaClient();
  const rateLimiter = new RateLimiter();

  try {
    await fetchOpenMeteoData(prisma, rateLimiter);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
```

---

## Phase 3: CSV Import & Database Integration

### Modify Existing Import Script

**File:** `server/scripts/import-csv-data.ts`

**Changes needed:**
1. Add parsing for new Open-Meteo fields (14 new weather metrics)
2. Handle new field names in CSV (backward compatible with existing format)
3. Add `--source` CLI argument to specify data directory (default: worldData_v2)
4. Add `--open-meteo-only` flag to skip existing data and only import Open-Meteo batches
5. Create dummy "City Name Open-Meteo" station for Open-Meteo data
6. Use `createMany({ skipDuplicates: true })` for safe re-runs
7. Add early validation with `--validate` flag (optional)

### Key Modifications

**1. Add CLI argument support:**

```typescript
// Parse command line arguments
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const openMeteoOnly = args.includes('--open-meteo-only');
const validateFlag = args.includes('--validate');

const dataSource = sourceArg ? sourceArg.split('=')[1] : 'worldData_v2';
const DATA_DIR = path.join(__dirname, '../../dataAndUtils', dataSource);

console.log(`Importing from: ${DATA_DIR}`);
if (openMeteoOnly) {
  console.log('Mode: Open-Meteo only (skipping existing worldcities data)');
}
```

**2. Update CSV field parsing:**

Look for the section that parses CSV rows and add the new fields:

```typescript
// Existing parsing (keep as-is)
// NOTE: For Open-Meteo CSVs, PRCP will contain precipitation_sum, SNWD will contain snowfall_sum (converted to mm)
const PRCP = parseFloat(row.PRCP) || null;
const SNWD = parseFloat(row.SNWD) || null;
const TAVG = parseFloat(row.TAVG) || null;
const TMAX = parseFloat(row.TMAX) || null;
const TMIN = parseFloat(row.TMIN) || null;
const AWND = parseFloat(row.AWND) || null;
// ... existing fields ...

// NEW: Add Open-Meteo field parsing
const apparentTempMean = parseFloat(row.apparentTempMean) || null;
const apparentTempMax = parseFloat(row.apparentTempMax) || null;
const apparentTempMin = parseFloat(row.apparentTempMin) || null;
const windSpeed10mMax = parseFloat(row.windSpeed10mMax) || null;
const sunshineDuration = parseFloat(row.sunshineDuration) || null;
const cloudCoverMean = parseFloat(row.cloudCoverMean) || null;
const dewPoint2mMean = parseFloat(row.dewPoint2mMean) || null;
const relativeHumidity2mMean = parseFloat(row.relativeHumidity2mMean) || null;
const snowfallWaterEquivSum = parseFloat(row.snowfallWaterEquivSum) || null;
const soilMoisture0to100cmMean = parseFloat(row.soilMoisture0to100cmMean) || null;
const daylightDuration = parseFloat(row.daylightDuration) || null;
const rainSum = parseFloat(row.rainSum) || null;
const snowfallSum = parseFloat(row.snowfallSum) || null;
const precipitationHours = parseFloat(row.precipitationHours) || null;
```

**3. Update weather record creation:**

Find where `prisma.weatherRecord.createMany()` happens and add new fields:

```typescript
const weatherRecordData = {
  cityId: city.id,
  stationId: station.id,  // Required field (uses station from upsert)
  date: row.date,

  // Existing fields - CRITICAL: Populated by BOTH data sources for automatic averaging
  // For Open-Meteo CSVs: PRCP contains precipitation_sum, SNWD contains snowfall_sum (converted to mm)
  // For existing CSVs: PRCP and SNWD contain original values
  PRCP,     // Existing + Open-Meteo → automatic averaging!
  SNWD,     // Existing + Open-Meteo → automatic averaging!
  TAVG,     // Existing + Open-Meteo → automatic averaging!
  TMAX,     // Existing + Open-Meteo → automatic averaging!
  TMIN,     // Existing + Open-Meteo → automatic averaging!
  AWND,
  DAPR,
  DATN,
  DATX,
  DWPR,
  MDPR,
  MDTN,
  MDTX,
  WDF2,
  WDF5,
  WSF2,
  WSF5,

  // NEW Open-Meteo fields (will be null for existing data)
  apparentTempMean,
  apparentTempMax,
  apparentTempMin,
  windSpeed10mMax,
  sunshineDuration,
  cloudCoverMean,
  dewPoint2mMean,
  relativeHumidity2mMean,
  snowfallWaterEquivSum,
  soilMoisture0to100cmMean,
  daylightDuration,
  rainSum,
  snowfallSum,
  precipitationHours
};

// Use createMany with skipDuplicates for re-run safety
await prisma.weatherRecord.createMany({
  data: recordsToInsert,
  skipDuplicates: true  // ← Prevents errors on re-runs
});
```

**Note:** Provenance is tracked via station name pattern (e.g., "Berlin Open-Meteo 2021-2024"), not via a separate field.

**Key Insight:** By populating the same core fields (TAVG/TMAX/TMIN, PRCP, SNWD) for both existing and Open-Meteo data, frontend consolidation and weekly aggregations automatically average across all 4 stations with zero code changes!

**4. Station handling for Open-Meteo:**

Create stations for Open-Meteo data (identified by station name pattern):

```typescript
// Get or create weather station (works for both real stations and Open-Meteo stations)
const station = await prisma.weatherStation.upsert({
  where: {
    name_cityId: {
      name: row.name,  // e.g., "Berlin Open-Meteo 2021-2024"
      cityId: city.id
    }
  },
  create: {
    name: row.name,
    cityId: city.id
  },
  update: {}
});

// Use station ID in weather record creation
const weatherRecordData = {
  cityId: city.id,
  stationId: station.id,  // Required field (uses dummy station for Open-Meteo)
  date: row.date,
  // ... all other fields
};
```

**Note:**
- Open-Meteo stations identifiable by name pattern: `{CityName} Open-Meteo {yearRange}`
- Examples: `"Berlin Open-Meteo 2021-2024"`, `"Berlin Open-Meteo 2010-2015"`
- Each city gets exactly **2 new stations** (one per year range)

**5. Add `--open-meteo-only` logic:**

Skip importing data if it's not from Open-Meteo station:

```typescript
// Inside CSV processing loop
for (const row of csvRows) {
  // Skip non-Open-Meteo data if flag is set
  if (openMeteoOnly && !row.name?.includes('Open-Meteo')) {
    continue;
  }

  // Process row normally...
}
```

**6. Add early validation (optional):**

```typescript
// After each batch import
if (validateFlag) {
  console.log('Running validation on imported batch...');
  const issues = await validateRecentRecords(batchRecordIds);
  if (issues.length > 0) {
    console.warn(`⚠️  Found ${issues.length} validation issues`);
    console.warn(issues.slice(0, 10)); // Show first 10
  }
}
```

### Import Process

1. **Run migration first** to add new weather metric fields
2. **Import existing data** (if not already imported) - uses existing station data
3. **Import Open-Meteo data** - creates dummy "{CityName} Open-Meteo" stations
4. **No conflicts:** Different date ranges (2016-2020 vs 2021-2024 & 2010-2015)
5. **Natural blending:** Same city, multiple stations (real + Open-Meteo dummy)

### How Data Blends for Better Averages

This plan leverages the frontend consolidation layer to keep multiple data sources in the backend while presenting clean, averaged data to users.

**Example: Berlin Data Flow**

**Database Structure (Backend):**
- City table: ONE entry for Berlin (cityId: 1223)
  - `id: 1223, name: "Berlin", country: "Germany", lat: 52.5167, long: 13.3833`
- WeatherStation table (BEFORE Open-Meteo):
  - Station id 1223: "Berlin Weather Station" (cityId: 1223)
  - Station id 8848: "Potsdam Weather Station" (cityId: 1223) - real station serving Berlin
- WeatherStation table (AFTER Open-Meteo):
  - Station id 1223-8848: Same as before (2 real stations)
  - Station id 9001: "Berlin Open-Meteo 2021-2024" (cityId: 1223) - dummy station for recent years
  - Station id 9002: "Berlin Open-Meteo 2010-2015" (cityId: 1223) - dummy station for historical years

**WeatherRecord table (BEFORE Open-Meteo):**
- 366 records with `stationId = 1223`, dates `2020-01-01` to `2020-12-31` (synthetic year = 2016-2020 avg)
- 366 records with `stationId = 8848`, dates `2020-01-01` to `2020-12-31` (synthetic year = 2016-2020 avg)
- **Total: 732 records (2 stations × 366 days)**

**WeatherRecord table (AFTER Open-Meteo):**
- Previous 732 records remain unchanged
- Add 366 records with `stationId = 9001`, dates `2020-01-01` to `2020-12-31` (synthetic year = 2021-2024 avg of 4 years)
- Add 366 records with `stationId = 9002`, dates `2020-01-01` to `2020-12-31` (synthetic year = 2010-2015 avg of 6 years)
- **New total: 1,464 records (4 stations × 366 days)**

**Data Flow for Map View (January 15th):**

1. **GraphQL Query**: `weatherByDate(monthDay: "0115")`
2. **API Returns**: 4 separate `WeatherData` objects for Berlin (cityId 1223)
   ```
   [
     { cityId: 1223, city: "Berlin", stationName: "Berlin Weather Station", avgTemp: 2.1°C },
     { cityId: 1223, city: "Berlin", stationName: "Potsdam Weather Station", avgTemp: 1.9°C },
     { cityId: 1223, city: "Berlin", stationName: "Berlin Open-Meteo 2021-2024", avgTemp: 3.0°C },
     { cityId: 1223, city: "Berlin", stationName: "Berlin Open-Meteo 2010-2015", avgTemp: 2.6°C }
   ]
   ```
3. **Frontend Consolidation** (in `map.tsx`):
   ```typescript
   // Groups by cityId, averages all stations
   consolidateWeatherByCity(weatherData)
   // Output: ONE record per cityId
   { cityId: 1223, city: "Berlin", stationName: "Berlin (4 stations avg)", avgTemp: 2.4°C }
   ```
4. **Map Rendering**: ONE marker for Berlin showing 2.4°C

**Data Flow for Weekly Aggregation:**

```typescript
// server/scripts/aggregate-weekly-weather.ts (NO CHANGES NEEDED!)
const allRecords = await prisma.weatherRecord.findMany({
  where: { cityId: 1223 } // Berlin
});

// For Week 1 (early January, ~7 days):
// BEFORE Open-Meteo: 14 records (2 stations × 7 days)
// AFTER Open-Meteo: 28 records (4 stations × 7 days)

// Automatic averaging across all 4 stations:
// - Station 1: Berlin Weather Station (2016-2020 avg = 5 years)
//   - PRCP populated, SNWD populated
// - Station 2: Potsdam Weather Station (2016-2020 avg = 5 years)
//   - PRCP populated, SNWD populated
// - Station 3: Berlin Open-Meteo 2021-2024 (4 years averaged)
//   - PRCP populated (from precipitation_sum), SNWD populated (from snowfall_sum converted to mm)
// - Station 4: Berlin Open-Meteo 2010-2015 (6 years averaged)
//   - PRCP populated (from precipitation_sum), SNWD populated (from snowfall_sum converted to mm)
// = Total of 20 years of data represented (5+5+4+6)!
// = 4x more data depth than before (20 years vs 5 years)

// CRITICAL BENEFIT: PRCP and SNWD fields populated by ALL stations
// Weekly averaging automatically includes all 4 data sources for precipitation and snow!
```

**Result:**
- **Backend**: Stores all data from all sources as separate synthetic-year stations (flexible, auditable)
- **Frontend**: Shows ONE marker per city with data averaged across all 4 stations (clean UX)
- **Weekly Graphs**: Use improved averages from 4x more years of data (20 years vs 5)
- **Performance**: Frontend consolidation on ~300-600 records takes <1ms

### Rollback Strategy

**To identify Open-Meteo data:**
```sql
-- Find all Open-Meteo stations (should be exactly 2 per city)
SELECT id, name, cityId
FROM weather_stations
WHERE name LIKE '% Open-Meteo%'
ORDER BY cityId, name;

-- Count Open-Meteo stations per city (should be 2)
SELECT cityId, c.name as city_name, COUNT(*) as station_count
FROM weather_stations ws
JOIN cities c ON ws.cityId = c.id
WHERE ws.name LIKE '% Open-Meteo%'
GROUP BY ws.cityId, c.name
HAVING COUNT(*) != 2  -- Flag cities with incorrect number of stations
ORDER BY station_count;

-- Count Open-Meteo records per city (should be 732 = 2 stations × 366 days)
SELECT ws.cityId, c.name as city_name, COUNT(*) as record_count
FROM weather_records wr
JOIN weather_stations ws ON wr.stationId = ws.id
JOIN cities c ON ws.cityId = c.id
WHERE ws.name LIKE '% Open-Meteo%'
GROUP BY ws.cityId, c.name
HAVING COUNT(*) != 732  -- Flag incomplete imports
ORDER BY record_count;

-- Check specific city's Open-Meteo data
SELECT ws.name as station_name, COUNT(*) as days
FROM weather_records wr
JOIN weather_stations ws ON wr.stationId = ws.id
WHERE ws.cityId = 1223  -- Berlin
  AND ws.name LIKE '% Open-Meteo%'
GROUP BY ws.id, ws.name;
-- Should return 2 rows: "Berlin Open-Meteo 2021-2024" (366 days), "Berlin Open-Meteo 2010-2015" (366 days)
```

**To clean up failed imports (SAFE with transaction):**
```sql
-- SAFE rollback with verification
BEGIN;

-- 1. Preview what will be deleted
SELECT
  'weather_records' as table_name,
  COUNT(*) as records_to_delete
FROM weather_records
WHERE stationId IN (
  SELECT id FROM weather_stations WHERE name LIKE '% Open-Meteo%'
);

SELECT
  'weather_stations' as table_name,
  COUNT(*) as stations_to_delete
FROM weather_stations
WHERE name LIKE '% Open-Meteo%';

-- 2. If counts look correct, proceed with deletion
DELETE FROM weather_records
WHERE stationId IN (
  SELECT id FROM weather_stations WHERE name LIKE '% Open-Meteo%'
);

DELETE FROM weather_stations
WHERE name LIKE '% Open-Meteo%';

-- 3. Verify deletion (should return 0)
SELECT COUNT(*) as remaining_open_meteo_records
FROM weather_records wr
JOIN weather_stations ws ON wr.stationId = ws.id
WHERE ws.name LIKE '% Open-Meteo%';

-- 4. If verification passes, commit. Otherwise, rollback
COMMIT;  -- or ROLLBACK if something looks wrong

-- To remove Open-Meteo data for SPECIFIC cities only:
BEGIN;

DELETE FROM weather_records
WHERE stationId IN (
  SELECT id FROM weather_stations
  WHERE name LIKE '% Open-Meteo%'
  AND cityId IN (1223, 456, 789)  -- Specific city IDs
);

DELETE FROM weather_stations
WHERE name LIKE '% Open-Meteo%'
  AND cityId IN (1223, 456, 789);

COMMIT;
```

**To re-run from checkpoint:**
1. Check `dataAndUtils/openMeteoData/fetch_progress.json` for last successful city
2. Check `dataAndUtils/openMeteoData/failed_cities.json` for cities that need retry
3. Re-run fetch script (will resume from checkpoint automatically)
4. Re-import specific batches using `--source=openMeteoData`
5. Re-run weekly aggregations to include new data:
   ```bash
   cd server
   npm run aggregate-weekly-weather
   ```

---

## Phase 3.5: Data Validation Script

### Script: `server/scripts/validate-weather-data.ts`

**Purpose:** Validate ALL weather records (not just OpenMeteo) for data quality issues.

**Validation Checks:**

```typescript
interface ValidationResult {
  recordId: number;
  cityId: number;
  date: string;
  field: string;
  value: number;
  issue: string;
  severity: 'warning' | 'error';
}

async function validateWeatherData() {
  const prisma = new PrismaClient();
  const anomalies: ValidationResult[] = [];

  // Fetch all records (or filter by dataSource)
  const records = await prisma.weatherRecord.findMany({
    select: {
      id: true,
      cityId: true,
      date: true,
      dataSource: true,
      TAVG: true,
      TMAX: true,
      TMIN: true,
      PRCP: true,
      cloudCoverMean: true,
      windSpeed10mMax: true,
      // ... all fields
    }
  });

  for (const record of records) {
    // Temperature validation (-89°C to 56.7°C - historical extremes)
    if (record.TAVG !== null && (record.TAVG < -89 || record.TAVG > 56.7)) {
      anomalies.push({
        recordId: record.id,
        cityId: record.cityId,
        date: record.date,
        field: 'TAVG',
        value: record.TAVG,
        issue: 'Temperature outside historical range',
        severity: 'error'
      });
    }

    // Precipitation validation (0 to 1000mm per day)
    if (record.PRCP !== null && (record.PRCP < 0 || record.PRCP > 1000)) {
      anomalies.push({
        recordId: record.id,
        cityId: record.cityId,
        date: record.date,
        field: 'PRCP',
        value: record.PRCP,
        issue: 'Precipitation outside reasonable range',
        severity: 'warning'
      });
    }

    // Cloud cover validation (0-100%)
    if (record.cloudCoverMean !== null && (record.cloudCoverMean < 0 || record.cloudCoverMean > 100)) {
      anomalies.push({
        recordId: record.id,
        cityId: record.cityId,
        date: record.date,
        field: 'cloudCoverMean',
        value: record.cloudCoverMean,
        issue: 'Cloud cover percentage outside valid range',
        severity: 'error'
      });
    }

    // Wind speed validation (0 to 400 km/h - world record is ~408 km/h)
    if (record.windSpeed10mMax !== null && (record.windSpeed10mMax < 0 || record.windSpeed10mMax > 400)) {
      anomalies.push({
        recordId: record.id,
        cityId: record.cityId,
        date: record.date,
        field: 'windSpeed10mMax',
        value: record.windSpeed10mMax,
        issue: 'Wind speed outside reasonable range',
        severity: 'warning'
      });
    }
  }

  // Check completeness of Open-Meteo imports
  console.log('\n📊 Checking Open-Meteo import completeness...');

  // 1. Check each city with Open-Meteo data has exactly 2 stations
  const openMeteoStationCounts = await prisma.weatherStation.groupBy({
    by: ['cityId'],
    where: { name: { contains: 'Open-Meteo' } },
    _count: { id: true }
  });

  const incompleteStations = openMeteoStationCounts.filter(c => c._count.id !== 2);
  if (incompleteStations.length > 0) {
    console.warn(`⚠️  ${incompleteStations.length} cities have incomplete Open-Meteo stations (should have 2)`);

    // Add to anomalies
    for (const city of incompleteStations) {
      anomalies.push({
        recordId: 0,
        cityId: city.cityId,
        date: '',
        field: 'station_count',
        value: city._count.id,
        issue: `City has ${city._count.id} Open-Meteo stations instead of 2`,
        severity: 'warning'
      });
    }
  }

  // 2. Check each Open-Meteo station has exactly 366 records
  const openMeteoStations = await prisma.weatherStation.findMany({
    where: { name: { contains: 'Open-Meteo' } },
    select: { id: true, name: true, cityId: true }
  });

  for (const station of openMeteoStations) {
    const recordCount = await prisma.weatherRecord.count({
      where: { stationId: station.id }
    });

    if (recordCount !== 366) {
      anomalies.push({
        recordId: 0,
        cityId: station.cityId,
        date: '',
        field: 'record_count',
        value: recordCount,
        issue: `Station "${station.name}" has ${recordCount} records instead of 366`,
        severity: 'error'
      });
    }
  }

  // Write results to file
  writeFileSync(
    'validation_results.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalRecords: records.length,
      anomalyCount: anomalies.length,
      openMeteoStations: openMeteoStations.length,
      citiesWithOpenMeteo: openMeteoStationCounts.length,
      anomalies: anomalies
    }, null, 2)
  );

  console.log(`✓ Validation complete: ${anomalies.length} anomalies found`);
  console.log(`  Errors: ${anomalies.filter(a => a.severity === 'error').length}`);
  console.log(`  Warnings: ${anomalies.filter(a => a.severity === 'warning').length}`);
  console.log(`  Open-Meteo stations: ${openMeteoStations.length}`);
  console.log(`  Cities with Open-Meteo: ${openMeteoStationCounts.length}`);
}
```

**Usage:**
```bash
cd server
npx tsx scripts/validate-weather-data.ts
```

**Note:** Validation logs anomalies but does NOT block import or modify data. Review `validation_results.json` to assess data quality.

**Completeness checks added:**
- Verifies each city with Open-Meteo data has exactly 2 stations (one for 2021-2024, one for 2010-2015)
- Verifies each Open-Meteo station has exactly 366 records (full synthetic year)
- Reports counts of Open-Meteo stations and cities in validation output

---

## Phase 4: GraphQL Schema Update

### Expose New Fields in GraphQL API

**File:** `server/src/graphql/WeatherData.ts`

**Purpose:** Make the new Open-Meteo fields accessible via GraphQL queries.

### Required Changes

Add the 14 new fields to the `WeatherData` GraphQL type definition:

```typescript
// In the WeatherData object type definition
export const WeatherData = objectType({
  name: 'WeatherData',
  definition(t) {
    // ... existing fields (city, country, date, TAVG, TMAX, TMIN, PRCP, SNWD, etc.)

    // NEW: Open-Meteo fields
    t.field('apparentTempMean', {
      type: 'Float',
      description: 'Apparent temperature mean (°C) - how temperature feels'
    });
    t.field('apparentTempMax', {
      type: 'Float',
      description: 'Apparent temperature maximum (°C)'
    });
    t.field('apparentTempMin', {
      type: 'Float',
      description: 'Apparent temperature minimum (°C)'
    });
    t.field('windSpeed10mMax', {
      type: 'Float',
      description: 'Maximum wind speed at 10m (km/h)'
    });
    t.field('sunshineDuration', {
      type: 'Float',
      description: 'Sunshine duration (seconds)'
    });
    t.field('cloudCoverMean', {
      type: 'Float',
      description: 'Mean cloud cover (%)'
    });
    t.field('dewPoint2mMean', {
      type: 'Float',
      description: 'Mean dew point at 2m (°C)'
    });
    t.field('relativeHumidity2mMean', {
      type: 'Float',
      description: 'Mean relative humidity at 2m (%)'
    });
    t.field('snowfallWaterEquivSum', {
      type: 'Float',
      description: 'Snowfall water equivalent sum (mm)'
    });
    t.field('soilMoisture0to100cmMean', {
      type: 'Float',
      description: 'Mean soil moisture 0-100cm depth (m³/m³)'
    });
    t.field('daylightDuration', {
      type: 'Float',
      description: 'Daylight duration (seconds)'
    });
    t.field('rainSum', {
      type: 'Float',
      description: 'Rain sum (mm)'
    });
    t.field('snowfallSum', {
      type: 'Float',
      description: 'Snowfall sum (cm)'
    });
    t.field('precipitationHours', {
      type: 'Float',
      description: 'Precipitation hours (h)'
    });
  },
});
```

### Regenerate GraphQL Schema

After updating the type definitions, regenerate the GraphQL schema file:

```bash
cd server
npm run generate
```

This updates `server/src/generated/schema.graphql` with the new fields.

### Testing

Test that the new fields are accessible in GraphQL Playground:

```graphql
query TestNewFields {
  weatherByDate(monthDay: "0315") {
    city
    country
    avgTemperature
...
  }
}
```

**Note:** Fields will be `null` for existing weather records (2016-2020 data), and populated for Open-Meteo records.

---

## Phase 5: Aggregation Update

### Script: `server/scripts/aggregate-weekly-weather.ts`

**Current behavior:** Already aggregates ALL weather records for each city by week

**Required changes:** The existing aggregation will automatically include all stations (existing + Open-Meteo), but new fields won't be aggregated until explicitly added to the script.

### Add Aggregation for New Fields

Find the section where weekly data is calculated and add aggregations for new Open-Meteo fields:

```typescript
// Existing aggregation (keep as-is)
const weekData = {
  week: weekNumber,
  avgTemp: calculateAvg(weekRecords, 'TAVG'),
  maxTemp: calculateMax(weekRecords, 'TMAX'),
  minTemp: calculateMin(weekRecords, 'TMIN'),
  totalPrecip: calculateSum(weekRecords, 'PRCP'),
  avgPrecip: calculateAvg(weekRecords, 'PRCP'),
  daysWithRain: countDaysWithValue(weekRecords, 'PRCP', 0),
  daysWithData: weekRecords.length,

  // NEW: Add Open-Meteo field aggregations
  avgCloudCover: calculateAvg(weekRecords, 'cloudCoverMean'),  // %
  avgSunshineDuration: calculateAvg(weekRecords, 'sunshineDuration') / 3600,  // Convert seconds to hours
  avgHumidity: calculateAvg(weekRecords, 'relativeHumidity2mMean'),  // %
  avgApparentTemp: calculateAvg(weekRecords, 'apparentTempMean'),  // °C
  avgDewPoint: calculateAvg(weekRecords, 'dewPoint2mMean'),  // °C
};
```

### Helper Function for Safe Averaging

The existing `calculateAvg` function should already handle null values, but verify it looks like this:

```typescript
function calculateAvg(records: any[], field: string): number | null {
  const values = records.map(r => r[field]).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
```

### Impact

After this change:
- Weekly aggregations will include cloud cover, sunshine, humidity, apparent temp, and dew point
- All station data (existing 2016-2020 + Open-Meteo 2010-2015 + Open-Meteo 2021-2024) automatically included
- 4x more data points (20 years represented vs 5 years)
- Sunshine duration converted to hours for readability (e.g., 8.5 hours instead of 30,600 seconds)

---

## Phase 6: Integration with Makefile

### New Makefile Targets

```makefile
# Fetch Open-Meteo data (run over multiple days due to rate limits)
fetch-open-meteo:
	@echo "$(GREEN)Fetching Open-Meteo historical data...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx tsx scripts/fetch-open-meteo-data.ts

# Import Open-Meteo CSV batches into database
import-open-meteo:
	@echo "$(GREEN)Importing Open-Meteo CSV data...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx tsx scripts/import-csv-data.ts --source=openMeteoData --open-meteo-only

# Complete Open-Meteo enrichment workflow
enrich-db-open-meteo: fetch-open-meteo import-open-meteo
	@echo "$(GREEN)Re-aggregating weekly weather with new data...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npm run aggregate-weekly-weather
	@echo "$(GREEN)✓ Database enrichment complete!$(NC)"
```

### Modified `db-setup` Workflow

**Option 1: Keep separate (recommended for initial rollout)**
- Existing `db-setup` remains unchanged
- Run `make enrich-db-open-meteo` separately after initial setup
- Allows testing without disrupting existing workflow

**Option 2: Integrate into db-setup (future)**
- Add `fetch-open-meteo` and `import-open-meteo` steps to `db-setup-v2`
- Runs automatically during full database setup
- Requires multiple days to complete due to rate limits

---

## Phase 7: Execution Strategy

### Monitoring & Logs

**Progress tracking:**
- Console output with city count and ETA
- `fetch_progress.json` for resumption
- `failed_cities.json` for retry

**Log files:**
- `fetch_open_meteo.log` - detailed API calls and responses
- `import_open_meteo.log` - import statistics

---

## Implementation Checklist

### Files to Create

1. **`server/scripts/fetch-open-meteo-data.ts`**
   - Main data fetching script
   - Optimized rate limiter with predictive timing
   - Checkpoint/resume logic
   - CSV generation with proper dataSource field
   - Error handling and logging
   - Support for `--limit=N` flag for testing

2. **`server/scripts/validate-weather-data.ts`**
   - Data validation script for ALL weather records
   - Validates temperature, precipitation, cloud cover, wind speed
   - Outputs anomalies to `validation_results.json`
   - Does not block import or modify data

3. **`dataAndUtils/openMeteoData/` directory**
   - Will be created by fetch script
   - Stores batches of CSV files

### Files to Modify

1. **`server/prisma/schema.prisma`**
   - Add new weather metric fields to `WeatherRecord` model (14 new fields)
   - All new fields should be optional (`Float?`)
   - NO structural changes to stationId or relations

2. **`server/scripts/import-csv-data.ts`**
   - Add parsing for new Open-Meteo fields (all 14 new fields)
   - Support `--source` flag to specify data directory (default: worldData_v2)
   - Add `--open-meteo-only` flag to skip non-Open-Meteo data
   - Add `--validate` flag for early data quality checks
   - Handle both old and new CSV formats (header-based parsing already works)
   - Create dummy "{CityName} Open-Meteo" station for Open-Meteo data
   - Use `createMany({ skipDuplicates: true })` for re-run safety

3. **`server/src/graphql/WeatherData.ts`** *(required)*
   - Add GraphQL field definitions for all 14 new Open-Meteo fields
   - Add descriptions for each field
   - Regenerate schema with `npm run generate`

4. **`server/scripts/aggregate-weekly-weather.ts`** *(required)*
   - Add aggregation logic for new fields (cloud cover, sunshine, humidity, apparent temp, dew point)
   - Convert sunshine duration from seconds to hours in output

5. **`server/scripts/validate-weather-data.ts`**
   - Add completeness checks for Open-Meteo imports
   - Verify each city has exactly 2 stations
   - Verify each station has exactly 366 records

6. **`Makefile`**
   - Add `fetch-open-meteo` target
   - Add `import-open-meteo` target
   - Add `enrich-db-open-meteo` combined target

7. **`server/package.json`** *(optional)*
   - Add npm scripts for Open-Meteo operations

### Testing Strategy

**Phase 1: Small-scale test (2-3 cities)**
```bash
# Fetch data for top 3 cities by population
cd server
npx tsx scripts/fetch-open-meteo-data.ts --limit=3

# Verify CSV format
ls ../dataAndUtils/openMeteoData/batch1/
head -20 ../dataAndUtils/openMeteoData/batch1/batch1_open_meteo_data.csv

# Import into database
npx tsx scripts/import-csv-data.ts --source=openMeteoData --open-meteo-only

# Check records were created
psql $DATABASE_URL -c "SELECT COUNT(*) FROM weather_records wr JOIN weather_stations ws ON wr.stationId = ws.id WHERE ws.name LIKE '% Open-Meteo';"

# Validate data
npx tsx scripts/validate-weather-data.ts
```

**Phase 2: Medium-scale test (50 cities)**
```bash
# Fetch data for top 50 cities
npx tsx scripts/fetch-open-meteo-data.ts --limit=50

# Test checkpoint/resume: stop script mid-run (Ctrl+C), then restart
npx tsx scripts/fetch-open-meteo-data.ts --limit=50  # Should resume from checkpoint

# Import and verify
npx tsx scripts/import-csv-data.ts --source=openMeteoData --open-meteo-only

# Check aggregation includes new data
npm run aggregate-weekly-weather

# Query a sample city to verify blended data
psql $DATABASE_URL -c "
  SELECT wr.date, wr.TAVG, ws.name as station_name, wr.stationId
  FROM weather_records wr
  JOIN weather_stations ws ON wr.stationId = ws.id
  WHERE wr.cityId = (SELECT id FROM cities WHERE name = 'Berlin' LIMIT 1)
  ORDER BY wr.date DESC
  LIMIT 20;
"
```

**Phase 3: Full deployment (~4,000 cities)**
```bash
# Run without limit flag (fetches all cities with population > 100k)
npx tsx scripts/fetch-open-meteo-data.ts

# Monitor rate limiter status and progress
# Script will run for multiple days, saving checkpoints every 100 cities
# Can stop and resume at any time

# After completion, import all batches
npx tsx scripts/import-csv-data.ts --source=openMeteoData --open-meteo-only

# Validate data quality
npx tsx scripts/validate-weather-data.ts

# Review validation results
cat server/validation_results.json

# Re-aggregate weekly weather
npm run aggregate-weekly-weather
```

---

## Critical Files Reference

### Must Read Before Implementation

1. **`/Users/ashlenlaurakurre/Documents/GitHub/vaycay_v2/server/prisma/schema.prisma`**
   - Current WeatherRecord structure
   - Understand existing fields and relationships

2. **`/Users/ashlenlaurakurre/Documents/GitHub/vaycay_v2/server/scripts/import-csv-data.ts`**
   - CSV parsing logic
   - Batch processing patterns
   - Error handling approach
   - Station and city creation logic

3. **`/Users/ashlenlaurakurre/Documents/GitHub/vaycay_v2/server/scripts/aggregate-weekly-weather.ts`**
   - Week grouping logic
   - Averaging calculations
   - Data validation (min 2 days per week)

4. **`/Users/ashlenlaurakurre/Documents/GitHub/vaycay_v2/dataAndUtils/openMeteoJsonSample.json`**
   - Example API response structure
   - Field names and data types
   - Handle null values

5. **`/Users/ashlenlaurakurre/Documents/GitHub/vaycay_v2/dataAndUtils/worldData_v2/batch1/batch1_weather_data.csv`**
   - Current CSV format template
   - Column order and naming

---

## Potential Challenges & Solutions

### Challenge 1: Coordinate Precision Mismatch
**Problem:** Database coordinates may differ slightly from API response coordinates
**Solution:** Use database coordinates for API calls; Open-Meteo returns nearest location data automatically
**Verification:** Make sure to store returned lat/long in CSV comments for debugging 

### Challenge 2: API Rate Limiting
**Problem:** 10,000 calls/day limit with ~40,000 total calls needed
**Solution:**
- Implement robust rate limiter with sliding windows
- Run over 4-5 days minimum
- Save progress frequently for resumption
- Monitor and adjust delays dynamically

### Challenge 3: Missing or Null Data
**Problem:** Some cities/dates may have incomplete data from API
**Solution:**
- All new fields are nullable in database (`Float?`)
- CSV import handles empty values
- Aggregation script already handles null values (counts valid data only)

### Challenge 4: Storage Space
**Problem:** CSV files may become large
**Solution:**
- Batch into ~100 cities per CSV file (~40 batch files total)
- Estimated size: ~50-100MB per batch, ~4-5GB total
- Compress older batches after import if needed

### Challenge 5: Import Time
**Problem:** Importing millions of new records takes time
**Solution:**
- Existing import script already optimized for bulk inserts
- Use batch processing (current script does this)
- Run during off-hours if needed
- Estimated: 30-60 minutes for full import

---

## Success Metrics

### Data Quality
- [ ] 2021-2024 data imported for 4,000+ cities
- [ ] 2010-2015 data imported for 4,000+ cities (optional)
- [ ] Cloud cover and sunshine duration populated (high priority fields)
- [ ] Less than 5% API call failures

### System Performance
- [ ] Weekly aggregations include new data automatically
- [ ] Frontend continues to function with new fields
- [ ] Database queries remain performant

### Operational
- [ ] Script can resume after interruption
- [ ] Clear logs for debugging
- [ ] CSV batches are well-organized and labeled
