# Weekly Aggregated Weather Data - Optimized Implementation Plan

## Executive Summary
Implement weekly aggregated temperature and precipitation data using a separate table pattern (mirroring `MonthlySunshine`), with proper statistical aggregation and integration into the existing `make db-setup` workflow.

## Current Status Update

**Weather Data Regeneration (2025-11-23)**
- ✅ All weather data batch files have been regenerated from dataAndUtils/legacy/utils/CleanData_MatchCities_ExpandDatesAndWeather.py and are now located in `dataAndUtils/worldData_v2/`
- 🎯 **Dual Database Strategy**: To compare the new data against the existing data, we will:
  1. Create a second PostgreSQL container (`db-v2`) running alongside the original (`db`)
  2. Temporarily reroute the `make db-setup` command to populate `db-v2` with the new batch files
  3. Maintain both databases during testing and comparison phase
  4. This allows side-by-side comparison of old vs. new data before committing to the new dataset

---

## Architecture Decisions

### ✅ Final Data Model: Separate `WeeklyWeather` Table
**Reasoning:**
1. **Mirrors proven pattern**: Matches existing `MonthlySunshine` architecture
2. **Optimal performance**: O(1) lookup by cityId (single relation)
3. **Clean separation**: Daily data intact for other use cases
4. **Maintainable**: Easy to rebuild/recalculate aggregates
5. **Read-optimized**: Perfect for high-frequency chart rendering

### ✅ Hook Location: CityPopup (Data Orchestration Layer)
**Reasoning:**
1. Consistent with sunshine data pattern
2. Centralized loading states
3. Single cache coordination point
4. DataChartTabs remains presentational

### ✅ Aggregation Strategy: Weekly (52 weeks)
**Reasoning:**
1. Good granularity for climate visualization
2. Statistically sound (7-day samples)
3. Manageable data size (52 points vs 365)
4. Standard meteorological practice

---

## Dual Database Setup for Data Comparison

### Docker Compose Configuration

To enable side-by-side comparison of old and new weather data, we'll run two PostgreSQL containers:

**File:** `docker-compose.yml`

```yaml
services:
  # Original database with existing data
  db:
    image: postgres:15
    container_name: vaycay-postgres-original
    environment:
      POSTGRES_DB: vaycay
      POSTGRES_USER: ${DB_USER:-vaycay_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-vaycay_pass}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # New database for v2 data comparison
  db-v2:
    image: postgres:15
    container_name: vaycay-postgres-v2
    environment:
      POSTGRES_DB: vaycay_v2
      POSTGRES_USER: ${DB_USER:-vaycay_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-vaycay_pass}
    ports:
      - "5433:5432"  # Map to different host port
    volumes:
      - postgres_data_v2:/var/lib/postgresql/data

volumes:
  postgres_data:
  postgres_data_v2:
```

### Environment Configuration

**File:** `.env` (add these variables)

```bash
# Database connection for original DB
DATABASE_URL="postgresql://vaycay_user:vaycay_pass@localhost:5432/vaycay"

# Database connection for v2 comparison
DATABASE_URL_V2="postgresql://vaycay_user:vaycay_pass@localhost:5433/vaycay_v2"
```

### Makefile Updates

Update the `db-setup` target to use `db-v2`:

**File:** `Makefile`

```makefile
# Temporary target for setting up v2 database with new data
db-setup-v2: check-prereqs
	@echo "$(GREEN)Setting up v2 database with new weather data...$(NC)"
	@echo "$(YELLOW)Starting PostgreSQL v2 container...$(NC)"
	docker compose up -d db-v2
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	@sleep 5
	@echo "$(YELLOW)Exporting DATABASE_URL_V2 for Prisma...$(NC)"
	@export DATABASE_URL="postgresql://vaycay_user:vaycay_pass@localhost:5433/vaycay_v2" && \
	cd server && npm run prisma:migrate && \
	cd server && npm run prisma:generate && \
	cd server && npm run import-csv-data && \
	cd server && npx tsx scripts/merge-duplicate-cities-optimized.ts && \
	cd server && npx tsx scripts/import-sunshine-hours.ts && \
	cd server && npx tsx scripts/reassign-cities-to-major-cities.ts && \
	cd server && npm run aggregate-weekly-weather
	@echo "$(GREEN)✓ V2 Database setup complete$(NC)"

# Original db-setup (unchanged for now)
db-setup: db-setup-v2  # Temporarily redirect to v2
```

### Data Comparison Strategy

Once both databases are populated:

1. **Query Comparison Script** - Create a script to compare statistics:
   ```typescript
   // server/scripts/compare-database-stats.ts
   // Connect to both DBs and compare:
   // - Total records count
   // - City coverage
   // - Data quality metrics
   // - Sample city comparisons
   ```

2. **Manual Testing** - Switch `DATABASE_URL` between the two to test:
   ```bash
   # Test with v2 data
   export DATABASE_URL="postgresql://vaycay_user:vaycay_pass@localhost:5433/vaycay_v2"
   cd server && npm run dev
   
   # Test with original data
   export DATABASE_URL="postgresql://vaycay_user:vaycay_pass@localhost:5432/vaycay"
   cd server && npm run dev
   ```

3. **Migration Decision** - After validation:
   - If v2 data is better → update default `DATABASE_URL` to use v2
   - If original is better → keep using original, remove v2 container
   - Archive the unused container: `docker compose down db-v2 -v`

### Update CSV Import Script

**File:** `server/scripts/import-csv-data.ts` (or wherever the import logic is)

Update the file path to point to the new location:

```typescript
// OLD: const DATA_PATH = path.join(__dirname, '../../dataAndUtils/worldData/');
const DATA_PATH = path.join(__dirname, '../../dataAndUtils/worldData_v2/');
```

---

## Database Schema

### Optimized Schema Design

```prisma
// Add to schema.prisma

model WeeklyWeather {
  id        Int     @id @default(autoincrement())
  cityId    Int     @unique  // ONE-TO-ONE with City (like MonthlySunshine)

  // Store as JSON array of 52 weeks for space efficiency
  // Alternative: 52 columns (more verbose but easier to query individual weeks)
  weeklyData Json    // Array of 52 week objects

  // Relations
  city      City    @relation(fields: [cityId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([cityId])

  @@map("weekly_weather")
}

// Update City model
model City {
  // ... existing fields ...
  monthlySunshine MonthlySunshine?
  weeklyWeather   WeeklyWeather?     // Add this
}
```

### JSON Structure for `weeklyData`
```typescript
// Each week object in the JSON array
interface WeekData {
  week: number;              // 1-52
  avgTemp: number | null;    // Mean TAVG
  maxTemp: number | null;    // Mean TMAX
  minTemp: number | null;    // Mean TMIN
  totalPrecip: number | null; // SUM PRCP
  avgPrecip: number | null;   // Mean PRCP
  daysWithRain: number | null; // Days where PRCP > 0
  daysWithData: number;       // Data quality: days with valid records
}

// Full weeklyData field
type WeeklyData = WeekData[]; // Length: 52
```

### Why JSON Instead of 52 Columns?

**Pros of JSON:**
- **Flexible**: Easy to add new metrics without migration
- **Compact**: One field vs 52 × 7 = 364 columns
- **TypeScript-friendly**: Matches frontend data structure
- **Same pattern**: Similar to how you might fetch it from API

**Cons of JSON:**
- **Less queryable**: Can't easily filter "all cities where week 25 > 30mm rain"
- **No column-level indexing**

**Decision: Use JSON** - Since we're only querying by cityId (never filtering by week values), JSON is optimal.

---

## Implementation Plan

### Phase 1: Database Schema & Migration

#### 1.1 Update Prisma Schema
**File:** `server/prisma/schema.prisma`

```prisma
// Add WeeklyWeather model (see above)
// Update City model to include weeklyWeather relation
```

#### 1.2 Create Migration
```bash
cd server
npx prisma migrate dev --name add_weekly_weather
```

This generates: `server/prisma/migrations/[timestamp]_add_weekly_weather/migration.sql`

---

### Phase 2: Aggregation Script

#### 2.1 Create Aggregation Script
**File:** `server/scripts/aggregate-weekly-weather.ts`

**High-Level Logic:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WeekData {
  week: number;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  totalPrecip: number | null;
  avgPrecip: number | null;
  daysWithRain: number | null;
  daysWithData: number;
}

// Helper: Calculate ISO week number from date string
function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper: Statistical aggregation
function calculateWeekStats(records: any[]): WeekData {
  const validTemps = records.filter(r => r.TAVG !== null);
  const validMaxTemps = records.filter(r => r.TMAX !== null);
  const validMinTemps = records.filter(r => r.TMIN !== null);
  const validPrecip = records.filter(r => r.PRCP !== null);

  // Require at least 2 days of data per week (user requirement)
  const hasEnoughData = records.length >= 2;

  return {
    week: 0, // Set by caller
    avgTemp: hasEnoughData && validTemps.length >= 2
      ? validTemps.reduce((sum, r) => sum + r.TAVG, 0) / validTemps.length
      : null,
    maxTemp: hasEnoughData && validMaxTemps.length >= 2
      ? validMaxTemps.reduce((sum, r) => sum + r.TMAX, 0) / validMaxTemps.length
      : null,
    minTemp: hasEnoughData && validMinTemps.length >= 2
      ? validMinTemps.reduce((sum, r) => sum + r.TMIN, 0) / validMinTemps.length
      : null,
    totalPrecip: hasEnoughData && validPrecip.length >= 2
      ? validPrecip.reduce((sum, r) => sum + r.PRCP, 0)
      : null,
    avgPrecip: hasEnoughData && validPrecip.length >= 2
      ? validPrecip.reduce((sum, r) => sum + r.PRCP, 0) / validPrecip.length
      : null,
    daysWithRain: hasEnoughData
      ? validPrecip.filter(r => r.PRCP > 0).length
      : null,
    daysWithData: records.length,
  };
}

async function aggregateWeeklyWeather() {
  console.log('🌤️  Starting weekly weather aggregation...\n');

  // Get all cities
  const cities = await prisma.city.findMany({
    select: { id: true, name: true, country: true },
  });

  console.log(`Found ${cities.length} cities to process\n`);

  let processedCount = 0;
  let errorCount = 0;

  for (const city of cities) {
    try {
      // Fetch all weather records for this city
      const records = await prisma.weatherRecord.findMany({
        where: { cityId: city.id },
        select: {
          date: true,
          TAVG: true,
          TMAX: true,
          TMIN: true,
          PRCP: true,
        },
      });

      if (records.length === 0) {
        console.log(`⚠️  ${city.name}, ${city.country}: No weather data, skipping`);
        continue;
      }

      // Group records by ISO week
      const weeklyRecords: Record<number, any[]> = {};

      for (const record of records) {
        const week = getISOWeek(record.date);
        if (!weeklyRecords[week]) {
          weeklyRecords[week] = [];
        }
        weeklyRecords[week].push(record);
      }

      // Calculate stats for each week (1-52)
      const weeklyData: WeekData[] = [];

      for (let week = 1; week <= 52; week++) {
        const weekRecords = weeklyRecords[week] || [];
        const stats = calculateWeekStats(weekRecords);
        stats.week = week;
        weeklyData.push(stats);
      }

      // Upsert into database
      await prisma.weeklyWeather.upsert({
        where: { cityId: city.id },
        create: {
          cityId: city.id,
          weeklyData: weeklyData as any, // Prisma JSON type
        },
        update: {
          weeklyData: weeklyData as any,
        },
      });

      processedCount++;

      if (processedCount % 100 === 0) {
        console.log(`✓ Processed ${processedCount}/${cities.length} cities`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${city.name}, ${city.country}:`, error);
    }
  }

  console.log(`\n✅ Aggregation complete!`);
  console.log(`   Processed: ${processedCount} cities`);
  console.log(`   Errors: ${errorCount} cities`);
  console.log(`   Total time: ${process.uptime().toFixed(1)}s`);
}

// Run
aggregateWeeklyWeather()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 2.2 Add NPM Script
**File:** `server/package.json`

```json
{
  "scripts": {
    "aggregate-weekly-weather": "tsx scripts/aggregate-weekly-weather.ts"
  }
}
```

#### 2.3 Update Makefile
**File:** `Makefile`

Update the `db-setup` target to include the new script:

```makefile
db-setup: check-prereqs
	@echo "$(GREEN)Setting up database...$(NC)"
	@echo "$(YELLOW)Starting PostgreSQL...$(NC)"
	docker compose up -d db
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	@sleep 5
	@echo "$(YELLOW)Running Prisma migrations...$(NC)"
	cd server && npm run prisma:migrate
	@echo "$(YELLOW)Generating Prisma client...$(NC)"
	cd server && npm run prisma:generate
	@echo "$(YELLOW)Importing CSV weather data (this will take 30-60 minutes for 7.5M records)...$(NC)"
	cd server && npm run import-csv-data
	@echo "$(YELLOW)Merging duplicate cities and consolidating PRCP data (this will take 5-10 minutes)...$(NC)"
	cd server && npx tsx scripts/merge-duplicate-cities-optimized.ts
	@echo "$(YELLOW)Importing monthly sunshine hours data...$(NC)"
	cd server && npx tsx scripts/import-sunshine-hours.ts
	@echo "$(YELLOW)Reassigning small cities to major cities...$(NC)"
	cd server && npx tsx scripts/reassign-cities-to-major-cities.ts
	@echo "$(YELLOW)Aggregating weekly weather data (this will take 2-5 minutes)...$(NC)"
	cd server && npm run aggregate-weekly-weather
	@echo "$(GREEN)✓ Database setup complete$(NC)"
```

---

### Phase 3: Backend API (GraphQL)

#### 3.1 Create GraphQL Types & Resolvers
**File:** `server/src/graphql/WeeklyWeatherData.ts`

```typescript
import { objectType, queryField, nonNull, stringArg, floatArg } from 'nexus';

// Week data point type
export const WeekDataPoint = objectType({
  name: 'WeekDataPoint',
  definition(t) {
    t.nonNull.int('week');
    t.float('avgTemp');
    t.float('maxTemp');
    t.float('minTemp');
    t.float('totalPrecip');
    t.float('avgPrecip');
    t.int('daysWithRain');
    t.nonNull.int('daysWithData');
  },
});

// City weekly weather type
export const CityWeeklyWeather = objectType({
  name: 'CityWeeklyWeather',
  definition(t) {
    t.nonNull.string('city');
    t.nonNull.string('country');
    t.string('state');
    t.float('lat');
    t.float('long');
    t.nonNull.list.nonNull.field('weeklyData', {
      type: 'WeekDataPoint',
    });
  },
});

// Query
export const weeklyWeatherByCityQuery = queryField('weeklyWeatherByCity', {
  type: 'CityWeeklyWeather',
  args: {
    city: nonNull(stringArg()),
    lat: floatArg(),
    long: floatArg(),
  },
  async resolve(_root, args, ctx) {
    // Find city with weekly weather
    const city = await ctx.prisma.city.findFirst({
      where: {
        name: { equals: args.city, mode: 'insensitive' },
        ...(args.lat !== undefined &&
          args.long !== undefined && {
            lat: args.lat,
            long: args.long,
          }),
      },
      include: {
        weeklyWeather: true,
      },
    });

    if (!city || !city.weeklyWeather) {
      return null;
    }

    return {
      city: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      long: city.long,
      weeklyData: city.weeklyWeather.weeklyData as any[], // JSON to array
    };
  },
});
```

#### 3.2 Export from Index
**File:** `server/src/graphql/index.ts`

```typescript
// Export all GraphQL types, queries, and mutations
export * from './enums';
export * from './WeatherData';
export * from './SunshineData';
export * from './WeeklyWeatherData'; // ADD THIS
```

#### 3.3 Test with GraphQL Playground
```bash
cd server
npm run dev
```

Navigate to `http://localhost:4001/graphql` and test:

```graphql
query {
  weeklyWeatherByCity(city: "London", lat: 51.5074, long: -0.1278) {
    city
    country
    weeklyData {
      week
      avgTemp
      totalPrecip
      daysWithData
    }
  }
}
```

---

### Phase 4: Frontend Implementation

#### 4.1 TypeScript Types
**File:** `client/src/types/weeklyWeatherDataType.ts`

```typescript
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
```

#### 4.2 GraphQL Query
**File:** `client/src/api/queries.ts`

```typescript
export const GET_WEEKLY_WEATHER_BY_CITY = gql`
  query GetWeeklyWeatherByCity($city: String!, $lat: Float, $long: Float) {
    weeklyWeatherByCity(city: $city, lat: $lat, long: $long) {
      city
      country
      state
      lat
      long
      weeklyData {
        week
        avgTemp
        maxTemp
        minTemp
        totalPrecip
        avgPrecip
        daysWithRain
        daysWithData
      }
    }
  }
`;
```

#### 4.3 Custom Hook with Caching
**File:** `client/src/api/dates/useWeeklyWeatherForCity.ts`

```typescript
import { useQuery } from '@apollo/client';
import { useEffect, useMemo } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { GET_WEEKLY_WEATHER_BY_CITY } from '../queries';
import { useCityDataCacheStore } from '@/stores/useCityDataCacheStore';

interface UseWeeklyWeatherForCityParams {
  cityName: string | null;
  lat?: number | null;
  long?: number | null;
  skipFetch?: boolean;
}

function useWeeklyWeatherForCity({
  cityName,
  lat,
  long,
  skipFetch = false,
}: UseWeeklyWeatherForCityParams) {
  const { getFromCache, addToCache, markAsRecentlyUsed } = useCityDataCacheStore();

  // Generate cache key
  const cacheKey = useMemo(() => {
    if (cityName && lat != null && long != null) {
      return `weekly-weather-${cityName.toLowerCase()}-${lat}-${long}`;
    }
    return null;
  }, [cityName, lat, long]);

  // Check cache
  const cachedData = cacheKey ? getFromCache(cacheKey) : null;

  // Fetch data
  const { data, loading, error } = useQuery<
    { weeklyWeatherByCity: CityWeeklyWeather },
    { city: string; lat?: number; long?: number }
  >(GET_WEEKLY_WEATHER_BY_CITY, {
    variables: {
      city: cityName || '',
      lat,
      long,
    },
    skip: skipFetch || !cityName || !cacheKey || !!cachedData?.weeklyWeatherData,
    fetchPolicy: 'network-only',
  });

  // Update cache when data is fetched
  useEffect(() => {
    if (data?.weeklyWeatherByCity && cacheKey) {
      // Store weekly weather in cache
      addToCache(cacheKey, null, null, data.weeklyWeatherByCity);
    }
  }, [data, cacheKey, addToCache]);

  // Mark as recently used
  useEffect(() => {
    if (cacheKey && cachedData?.weeklyWeatherData) {
      markAsRecentlyUsed(cacheKey);
    }
  }, [cacheKey, cachedData, markAsRecentlyUsed]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const context = cityName ? ` for ${cityName}` : '';
      parseErrorAndNotify(error, `failed to load weekly weather data${context}`);
    }
  }, [error, cityName]);

  const weeklyWeatherData = cachedData?.weeklyWeatherData || data?.weeklyWeatherByCity || null;

  return {
    weeklyWeatherData,
    loading,
    error: !!error,
  };
}

export default useWeeklyWeatherForCity;
```

#### 4.4 Update Cache Store
**File:** `client/src/stores/useCityDataCacheStore.ts`

```typescript
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

interface CachedCityData {
  weatherData: WeatherData | null;
  sunshineData: SunshineData | null;
  weeklyWeatherData: CityWeeklyWeather | null; // ADD THIS
  timestamp: number;
}

// Update addToCache signature
addToCache: (
  key: string,
  weatherData: WeatherData | null,
  sunshineData: SunshineData | null,
  weeklyWeatherData?: CityWeeklyWeather | null // ADD THIS
) => void;

// Update implementation
addToCache: (key, weatherData, sunshineData, weeklyWeatherData = null) =>
  set((state) => {
    // ... existing logic ...

    newCache[key] = {
      weatherData: weatherData ?? existing?.weatherData ?? null,
      sunshineData: sunshineData ?? existing?.sunshineData ?? null,
      weeklyWeatherData: weeklyWeatherData ?? existing?.weeklyWeatherData ?? null, // ADD THIS
      timestamp: Date.now(),
    };

    // ... rest of logic ...
  }),
```

#### 4.5 Integrate Hook in CityPopup
**File:** `client/src/components/CityPopup/CityPopup.tsx`

```typescript
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';

// Inside CityPopup component, after existing hooks:

const { weeklyWeatherData, loading: weeklyWeatherLoading, error: weeklyWeatherError } =
  useWeeklyWeatherForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    skipFetch: !city,
  });

// Pass to DataChartTabs:
<DataChartTabs
  displaySunshineData={displaySunshineData}
  sunshineLoading={sunshineLoading}
  sunshineError={sunshineError}
  selectedMonth={monthToUse}
  weeklyWeatherData={weeklyWeatherData}
  weeklyWeatherLoading={weeklyWeatherLoading}
  weeklyWeatherError={weeklyWeatherError}
/>
```

#### 4.6 Update DataChartTabs Props
**File:** `client/src/components/CityPopup/DataChartTabs.tsx`

```typescript
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

interface DataChartTabsProps {
  displaySunshineData: SunshineData | null;
  sunshineLoading: boolean;
  sunshineError: boolean;
  selectedMonth: number;
  weeklyWeatherData: CityWeeklyWeather | null;
  weeklyWeatherLoading: boolean;
  weeklyWeatherError: boolean;
}

const DataChartTabs = ({
  displaySunshineData,
  sunshineLoading,
  sunshineError,
  selectedMonth,
  weeklyWeatherData,
  weeklyWeatherLoading,
  weeklyWeatherError,
}: DataChartTabsProps) => {
  return (
    <Tabs orientation="vertical" defaultValue="temp" className="h-full">
      <Tabs.List>
        <Tabs.Tab value="temp" leftSection={<IconTemperature size={12} />}>
          Temp
        </Tabs.Tab>
        <Tabs.Tab value="sun" leftSection={<IconSun size={12} />}>
          Sun
        </Tabs.Tab>
        <Tabs.Tab value="precip" leftSection={<IconDroplet size={12} />}>
          Precip
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="temp">
        <TemperatureGraph
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
          selectedMonth={selectedMonth}
        />
      </Tabs.Panel>

      <Tabs.Panel value="sun">
        <SunshineDataSection
          displaySunshineData={displaySunshineData}
          isLoading={sunshineLoading}
          hasError={sunshineError}
          selectedMonth={selectedMonth}
        />
      </Tabs.Panel>

      <Tabs.Panel value="precip">
        <RainfallGraph
          weeklyWeatherData={weeklyWeatherData}
          isLoading={weeklyWeatherLoading}
          hasError={weeklyWeatherError}
          selectedMonth={selectedMonth}
        />
      </Tabs.Panel>
    </Tabs>
  );
};
```

---

### Phase 5: Chart Components

#### 5.1 Temperature Graph
**File:** `client/src/components/CityPopup/TemperatureGraph.tsx`

```typescript
import { useMemo, memo, useRef, useEffect } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  SUNSHINE_CHART_GRID_COLOR,
  SUNSHINE_CHART_AXIS_COLOR,
} from '@/const';

interface TemperatureGraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  selectedMonth?: number;
}

const TemperatureGraph = ({ weeklyWeatherData, selectedMonth }: TemperatureGraphProps) => {
  const previousCityRef = useRef<string | null>(null);
  const currentCityKey = weeklyWeatherData
    ? `${weeklyWeatherData.city}-${weeklyWeatherData.lat}-${weeklyWeatherData.long}`
    : null;
  const shouldAnimate = previousCityRef.current !== currentCityKey;

  useEffect(() => {
    previousCityRef.current = currentCityKey;
  }, [currentCityKey]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!weeklyWeatherData) return [];

    return weeklyWeatherData.weeklyData.map((week) => ({
      week: week.week,
      avgTemp: week.avgTemp,
      maxTemp: week.maxTemp,
      minTemp: week.minTemp,
      daysWithData: week.daysWithData,
      // Convert week to approximate month for reference line
      month: Math.ceil(week.week / 4.33),
    }));
  }, [weeklyWeatherData]);

  if (!weeklyWeatherData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No temperature data available</div>;
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={SUNSHINE_CHART_GRID_COLOR} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: 'Week', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: '°C', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number | null) => (value !== null ? `${value.toFixed(1)}°C` : 'N/A')}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="line"
          />

          {/* Reference line for selected month */}
          {selectedMonth && (
            <ReferenceLine
              x={Math.round(selectedMonth * 4.33)}
              stroke="#FF6B6B"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}

          {/* Temperature lines */}
          <Line
            type="monotone"
            dataKey="maxTemp"
            stroke="#FF6B6B"
            strokeWidth={1.5}
            dot={false}
            name="Max Temp"
            connectNulls
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="avgTemp"
            stroke="#4ECDC4"
            strokeWidth={2}
            dot={false}
            name="Avg Temp"
            connectNulls
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="minTemp"
            stroke="#45B7D1"
            strokeWidth={1.5}
            dot={false}
            name="Min Temp"
            connectNulls
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(TemperatureGraph);
```

#### 5.2 Rainfall Graph
**File:** `client/src/components/CityPopup/RainfallGraph.tsx`

```typescript
import { useMemo, memo, useRef, useEffect } from 'react';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  SUNSHINE_CHART_GRID_COLOR,
  SUNSHINE_CHART_AXIS_COLOR,
} from '@/const';

interface RainfallGraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  selectedMonth?: number;
}

const RainfallGraph = ({ weeklyWeatherData, selectedMonth }: RainfallGraphProps) => {
  const previousCityRef = useRef<string | null>(null);
  const currentCityKey = weeklyWeatherData
    ? `${weeklyWeatherData.city}-${weeklyWeatherData.lat}-${weeklyWeatherData.long}`
    : null;
  const shouldAnimate = previousCityRef.current !== currentCityKey;

  useEffect(() => {
    previousCityRef.current = currentCityKey;
  }, [currentCityKey]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (!weeklyWeatherData) return [];

    return weeklyWeatherData.weeklyData.map((week) => ({
      week: week.week,
      totalPrecip: week.totalPrecip,
      daysWithRain: week.daysWithRain,
      daysWithData: week.daysWithData,
      month: Math.ceil(week.week / 4.33),
    }));
  }, [weeklyWeatherData]);

  if (!weeklyWeatherData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No precipitation data available</div>;
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={SUNSHINE_CHART_GRID_COLOR} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: 'Week', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke={SUNSHINE_CHART_AXIS_COLOR}
            label={{ value: 'mm', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number | null) => (value !== null ? `${value.toFixed(1)} mm` : 'N/A')}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingLeft: '13px' }}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />

          {/* Reference line for selected month */}
          {selectedMonth && (
            <ReferenceLine
              x={Math.round(selectedMonth * 4.33)}
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}

          {/* Precipitation bars */}
          <Bar
            dataKey="totalPrecip"
            fill="#3B82F6"
            name="Weekly Rainfall"
            isAnimationActive={shouldAnimate}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default memo(RainfallGraph);
```

#### 5.3 Add Loading/Error Wrappers
Update both graph components to handle loading and error states:

```typescript
interface GraphProps {
  weeklyWeatherData: CityWeeklyWeather | null;
  isLoading: boolean;
  hasError: boolean;
  selectedMonth?: number;
}

// Inside component:
if (isLoading) {
  return <div className="flex items-center justify-center h-full">Loading...</div>;
}

if (hasError) {
  return <div className="flex items-center justify-center h-full">Failed to load data</div>;
}
```

---

## Performance Optimizations

### 1. **Memoization**
- ✅ `useMemo` for data transformations
- ✅ `memo()` for chart components
- ✅ Animation control based on city changes

### 2. **LRU Caching**
- ✅ Store up to 30 cities' weekly weather in cache
- ✅ Automatic eviction of least recently used
- ✅ Cache key: `weekly-weather-${city}-${lat}-${long}`

### 3. **Lazy Loading**
- ✅ Charts only render when tab is active (Mantine Tabs behavior)
- ✅ `skipFetch` parameter prevents unnecessary API calls

### 4. **Database Performance**
- ✅ Single relation lookup (`cityId`)
- ✅ JSON field retrieval (fast)
- ✅ No JOINs or aggregations at query time

---

## Testing Checklist

- [ ] Run aggregation script on local database
- [ ] Verify all cities have weekly data (check for nulls)
- [ ] Test GraphQL query in Playground
- [ ] Test frontend with various cities
- [ ] Verify cache behavior (inspect Zustand store in DevTools)
- [ ] Test rapid city switching (animations should work correctly)
- [ ] Test with cities that have sparse data (< 2 days per week)
- [ ] Verify selected month reference line appears correctly

---

## Rollout Plan

1. **Phase 1: Backend** (Can be done now)
   - Update schema, run migration
   - Create and run aggregation script
   - Add to `make db-setup`

2. **Phase 2: API** (After backend complete)
   - Add GraphQL types/resolvers
   - Test with Playground

3. **Phase 3: Frontend Data** (After API ready)
   - Add types, queries, hooks
   - Update cache store
   - Integrate in CityPopup

4. **Phase 4: UI** (After data layer works)
   - Build chart components
   - Test with real data
   - Polish UX

---

## Future Enhancements

1. **Annual Comparison**: Show multiple years overlaid
2. **City Comparison**: Side-by-side charts for 2 cities
3. **Export**: Download chart as PNG or data as CSV
4. **Data Quality Indicators**: Visual indicator when `daysWithData < 5`
5. **Incremental Updates**: Only re-aggregate new/changed cities

---

## Estimated Timeline

- **Schema + Migration**: 15 min
- **Aggregation Script**: 1-2 hours
- **Run Aggregation**: 5-10 minutes (one-time)
- **GraphQL API**: 30 min
- **Frontend Hook + Types**: 30 min
- **Chart Components**: 1-2 hours
- **Testing + Polish**: 1 hour

**Total: 4-6 hours of development time**
