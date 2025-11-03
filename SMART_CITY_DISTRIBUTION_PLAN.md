# Smart City Distribution Plan (Optimized)

## Executive Summary

This plan addresses the data coverage issues identified in Phase 1 by implementing a **single-query, performance-optimized solution** that ensures fair global distribution while maintaining fast response times.

**Key Improvements:**
- ✅ Single database query using window functions (~300ms)
- ✅ Fair per-country quotas (no country dominates)
- ✅ In-memory caching for repeated queries (<5ms)
- ✅ Seamless integration with Phase 2 zoom-based loading
- ✅ Guaranteed representation for all countries

## Problem Statement

After implementing Phase 1 (global coverage with 1 city per country + top 300 by population), we've identified critical issues:

1. **Country Imbalance**: Large countries like China and India dominate the map with too many cities
2. **Missing Cities**: Some countries (e.g., Australia) aren't showing up despite having data
3. **Performance Concerns**: Need to maintain fast query times while adding complexity
4. **Need for Zoom Support**: Users should see more detail when zooming into specific regions

## Current State Analysis

### What We Know
- **Total cities**: ~26,527 cities across ~150 countries
- **Current limit**: 300 cities globally
- **Current strategy**: 1 per country + top 300 by population
- **Problem**: Top 300 by population heavily favors China, India, USA, Indonesia, Brazil
- **Current performance**: ~250ms per query (2 separate queries)

### Why Australia Might Be Missing
- Current query uses `DISTINCT ON (country)` which should return Australia
- Need to add logging to verify which countries are actually returned
- Possible causes: no data for queried date, NULL populations, or query bug

## Optimized Solution: Single-Query Adaptive Quotas

### Core Principle: Performance-First Design

**Critical Insight**: The original three-tier approach would require ~150 separate database queries, resulting in 7-30 second response times. This is unacceptable for a web application.

**Solution**: Use a **single SQL query with window functions** to:
1. Rank cities within each country by population
2. Calculate adaptive quotas based on country count
3. Apply quotas and return final result set
4. All in one database round-trip (~300ms)

### Single-Query Algorithm

```sql
WITH ranked_cities AS (
  -- Rank cities within each country by population
  SELECT 
    c.id,
    c.country,
    c.population,
    ROW_NUMBER() OVER (
      PARTITION BY c.country 
      ORDER BY c.population DESC NULLS LAST
    ) as country_rank
  FROM cities c
  INNER JOIN weather_records wr ON wr."cityId" = c.id
  WHERE wr.date = $1
),
country_stats AS (
  -- Calculate how many countries we have
  SELECT COUNT(DISTINCT country) as total_countries
  FROM ranked_cities
),
quota_calc AS (
  -- Calculate per-country quota based on total countries
  SELECT 
    CASE 
      WHEN total_countries > 30 THEN 6  -- 1 guaranteed + 5 additional
      WHEN total_countries > 15 THEN 11 -- 1 guaranteed + 10 additional
      ELSE 21                           -- 1 guaranteed + 20 additional
    END as max_per_country
  FROM country_stats
)
SELECT rc.id
FROM ranked_cities rc
CROSS JOIN quota_calc qc
WHERE rc.country_rank <= qc.max_per_country
ORDER BY 
  rc.country_rank,  -- Prioritize country representatives (rank 1)
  rc.population DESC NULLS LAST
LIMIT 300;
```

### How It Works

1. **Window Functions**: PostgreSQL ranks all cities within their country in a single pass
2. **Dynamic Quotas**: Quota calculation adapts based on total country count
3. **Efficient Filtering**: Only cities within quota are selected
4. **Single Round-Trip**: All logic executes in one database query

### Performance Characteristics

- **Query Time**: ~300ms (similar to current implementation)
- **No N+1 Problem**: Single query regardless of country count
- **Indexed**: Leverages existing indexes on date, cityId, population, country
- **Cacheable**: Deterministic results enable caching

### Example Scenarios

#### Scenario A: 150 Countries (Global View)
```
Window function ranks cities 1-N within each country
Quota calculation: 150 countries > 30 → max 6 cities per country
Result: Each country gets up to 6 cities (1 guaranteed + 5 additional)
Total: ~300 cities, fair distribution
```

#### Scenario B: 20 Countries (Continental View)
```
Window function ranks cities 1-N within each country
Quota calculation: 20 countries (15-30 range) → max 11 cities per country
Result: Each country gets up to 11 cities
Total: ~220 cities (20 × 11), more detail per country
```

#### Scenario C: 5 Countries (Regional View)
```
Window function ranks cities 1-N within each country
Quota calculation: 5 countries < 15 → max 21 cities per country
Result: Each country gets up to 21 cities
Total: ~105 cities, maximum detail per country
```

## Caching Strategy

### Problem
- 365 possible dates in the dataset
- Each query takes ~300ms
- Users frequently switch between dates
- Repeated queries waste resources

### Solution: In-Memory Cache

```typescript
// server/src/utils/cache.ts
import NodeCache from 'node-cache';

// Cache for 1 hour (3600 seconds)
const weatherCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 600  // Check for expired entries every 10 minutes
});

export function getCachedWeatherData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = weatherCache.get<T>(cacheKey);
  if (cached) {
    console.log(`✓ Cache hit: ${cacheKey}`);
    return Promise.resolve(cached);
  }
  
  console.log(`✗ Cache miss: ${cacheKey}`);
  return fetchFn().then(data => {
    weatherCache.set(cacheKey, data);
    return data;
  });
}
```

### Cache Performance

- **First request**: ~300ms (database query)
- **Subsequent requests**: <5ms (memory lookup)
- **Memory usage**: ~55MB for all 365 dates (acceptable)
- **Auto-expiration**: 1-hour TTL prevents stale data

### Usage in Resolver

```typescript
const cacheKey = `weather:${dateStr}`;
return getCachedWeatherData(cacheKey, async () => {
  // Execute expensive database query
  const cityIds = await context.prisma.$queryRaw<Array<{ id: number }>>`
    -- Single-query algorithm here
  `;
  // ... rest of query logic
  return results;
});
```

## Phase 2: Zoom-Based Loading Integration

### Bounds-First Approach

**Key Optimization**: Filter by geographic bounds BEFORE applying quotas, not after.

This reduces the dataset by 90%+ when zoomed in, making queries even faster.

### Optimized Phase 2 Query

```sql
WITH bounded_cities AS (
  -- FIRST: Filter by geographic bounds (reduces dataset dramatically)
  SELECT 
    c.id,
    c.country,
    c.population
  FROM cities c
  INNER JOIN weather_records wr ON wr."cityId" = c.id
  WHERE 
    wr.date = $1
    AND c.lat BETWEEN $2 AND $3
    AND c.long BETWEEN $4 AND $5
),
ranked_cities AS (
  -- THEN: Rank within each country
  SELECT 
    id,
    country,
    population,
    ROW_NUMBER() OVER (
      PARTITION BY country 
      ORDER BY population DESC NULLS LAST
    ) as country_rank
  FROM bounded_cities
),
country_stats AS (
  -- Calculate countries within bounds
  SELECT COUNT(DISTINCT country) as total_countries
  FROM bounded_cities
),
quota_calc AS (
  -- Apply same adaptive quota logic
  SELECT 
    CASE 
      WHEN total_countries > 30 THEN 6
      WHEN total_countries > 15 THEN 11
      ELSE 21
    END as max_per_country
  FROM country_stats
)
SELECT rc.id
FROM ranked_cities rc
CROSS JOIN quota_calc qc
WHERE rc.country_rank <= qc.max_per_country
ORDER BY rc.country_rank, rc.population DESC NULLS LAST
LIMIT 300;
```

### Zoom Level Strategy

#### Global View (Zoom 1-3)
```
Query: weatherByDate(monthDay: "0315")
Performance: ~300ms (first), <5ms (cached)
Countries: ~150
Per-country quota: 6 cities
```

#### Continental View (Zoom 4-6)
```
Query: weatherByDateAndBounds(monthDay: "0315", bounds: {...})
Performance: ~200ms (smaller dataset)
Countries: ~10-30
Per-country quota: 6-11 cities
```

#### Country View (Zoom 7-9)
```
Query: weatherByDateAndBounds(monthDay: "0315", bounds: {...})
Performance: ~100ms (much smaller dataset)
Countries: 1-5
Per-country quota: 21 cities
```

#### City View (Zoom 10+)
```
Query: weatherByDateAndBounds(monthDay: "0315", bounds: {...})
Performance: ~50ms (tiny dataset)
Countries: 1
Result: All cities in view (typically <50)
```

### Client-Side Implementation

```typescript
// Detect when to switch queries
const shouldUseBounds = mapZoom >= 4;

// Debounce zoom/pan events
const debouncedFetch = useMemo(
  () => debounce((bounds) => {
    if (shouldUseBounds) {
      fetchWeatherByBounds(date, bounds);
    } else {
      fetchWeatherByDate(date);
    }
  }, 300),
  [shouldUseBounds, date]
);

// Trigger on map move
useEffect(() => {
  const bounds = map.getBounds();
  debouncedFetch(bounds);
}, [mapZoom, mapCenter]);
```

## Configuration Constants

```typescript
// server/src/const.ts

// Maximum cities to display at any zoom level
export const MAX_CITIES_GLOBAL_VIEW = 300;

// Adaptive quota thresholds
export const QUOTA_THRESHOLDS = {
  // When countries > 30: strict limit (many countries visible)
  MANY_COUNTRIES: 30,
  MAX_PER_COUNTRY_MANY: 6,  // 1 guaranteed + 5 additional
  
  // When countries 15-30: moderate limit
  MODERATE_COUNTRIES: 15,
  MAX_PER_COUNTRY_MODERATE: 11,  // 1 guaranteed + 10 additional
  
  // When countries < 15: generous limit (few countries visible)
  MAX_PER_COUNTRY_FEW: 21,  // 1 guaranteed + 20 additional
};

// Caching configuration
export const CACHE_CONFIG = {
  // Cache TTL in seconds (1 hour)
  TTL: 3600,
  
  // Check for expired entries every 10 minutes
  CHECK_PERIOD: 600,
};

// Zoom-based loading thresholds
export const ZOOM_THRESHOLDS = {
  // Use global query (no bounds) for zoom levels 1-3
  GLOBAL_VIEW_MAX_ZOOM: 3,
  
  // Use bounds query for zoom levels 4+
  BOUNDS_VIEW_MIN_ZOOM: 4,
  
  // Minimum bounds change to trigger new query (degrees)
  MIN_BOUNDS_CHANGE: 5,
  
  // Debounce delay for zoom/pan events (ms)
  DEBOUNCE_DELAY: 300,
};
```

## Implementation Plan

### Phase 1.5: Single-Query Quotas with Caching (Immediate)

**Priority**: HIGH - Fixes current imbalance issue

**Tasks**:
1. Install `node-cache` package: `npm install node-cache @types/node-cache`
2. Create `server/src/utils/cache.ts` with caching utility
3. Update `server/src/const.ts` with quota and cache configuration
4. Replace current `weatherByDateQuery` with single-query approach
5. Add comprehensive logging for debugging
6. Test with multiple dates to verify:
   - Fair distribution (no country > 6 cities globally)
   - All countries represented
   - Australia appears
   - Performance ~300ms first request, <5ms cached

**Estimated Time**: 2-3 hours

**Expected Performance**:
- First request: ~300ms
- Cached requests: <5ms
- Memory usage: ~55MB for all dates

### Phase 2: Bounds-Based Loading (Next Sprint)

**Priority**: MEDIUM - Enhances user experience

**Tasks**:
1. Create new GraphQL query: `weatherByDateAndBounds`
2. Implement bounds-first filtering in SQL
3. Add GraphQL arguments: `minLat`, `maxLat`, `minLong`, `maxLong`
4. Update client to detect map bounds
5. Implement query switching logic (global vs bounds)
6. Add debouncing for zoom/pan events
7. Test at various zoom levels

**Estimated Time**: 4-6 hours

**Expected Performance**:
- Global view: ~300ms (first), <5ms (cached)
- Zoomed views: ~50-200ms (smaller datasets)

### Phase 3: Polish and Optimization (Future)

**Priority**: LOW - Nice-to-have improvements

**Tasks**:
- Add loading states and transitions
- Implement preloading for adjacent zoom levels
- Add "show all cities" toggle for power users
- Highlight capital cities differently
- Add city clustering at high zoom levels

## Benefits of This Approach

### ✅ Performance
- **Single Query**: No N+1 problem (7.7s → 0.3s)
- **Window Functions**: Database does heavy lifting efficiently
- **Caching**: Repeated queries are instant (<5ms)
- **Indexed**: Leverages existing database indexes
- **Bounds-First**: Phase 2 queries are even faster

### ✅ Fair Distribution
- No single country dominates the map
- Every country gets guaranteed representation
- Adaptive quotas based on country count
- Larger countries get more cities, but within limits

### ✅ Scalability
- Handles 26k cities efficiently
- Works at any zoom level
- Predictable performance regardless of data size
- Memory efficient caching

### ✅ User Experience
- Fast initial load (~300ms)
- Instant date switching (<5ms cached)
- Smooth zoom transitions
- More detail when zoomed in
- Global coverage when zoomed out

### ✅ Maintainability
- Single query is easier to debug
- Configuration constants are adjustable
- Phase 1.5 works independently
- Phase 2 builds on top seamlessly
- No breaking changes to existing code

## Testing Strategy

### Phase 1.5 Testing

#### 1. Performance Testing
```bash
# Test query performance
time curl 'http://localhost:4001/graphql' \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { weatherByDate(monthDay: \"0315\") { city country } }"}'

# Expected: ~300ms first request, <5ms subsequent requests
```

#### 2. Distribution Testing
```sql
-- Verify no country has more than 6 cities
SELECT country, COUNT(*) as city_count
FROM (
  -- Run the single-query algorithm here
) as results
GROUP BY country
HAVING COUNT(*) > 6;

-- Expected: 0 rows (no country exceeds quota)
```

#### 3. Coverage Testing
```sql
-- Verify all countries are represented
SELECT DISTINCT c.country
FROM cities c
INNER JOIN weather_records wr ON wr."cityId" = c.id
WHERE wr.date = '2020-03-15'
ORDER BY c.country;

-- Compare with results from query
-- Expected: All countries appear in results
```

#### 4. Australia Debug
```sql
-- Check if Australia has data
SELECT c.name, c.population 
FROM cities c
INNER JOIN weather_records wr ON wr."cityId" = c.id
WHERE c.country = 'Australia' AND wr.date = '2020-03-15'
ORDER BY c.population DESC NULLS LAST;

-- Expected: At least 1 city with data
```

### Phase 2 Testing

#### 1. Bounds Filtering
```bash
# Test bounds query (North America)
curl 'http://localhost:4001/graphql' \
  -H 'Content-Type: application/json' \
  --data '{
    "query": "query { 
      weatherByDateAndBounds(
        monthDay: \"0315\",
        minLat: 25, maxLat: 50,
        minLong: -125, maxLong: -65
      ) { city country } 
    }"
  }'

# Expected: Only North American cities
```

#### 2. Quota Adaptation
```sql
-- Verify quotas adapt to country count
-- When 10 countries in bounds, expect max 11 cities per country
-- When 50 countries in bounds, expect max 6 cities per country
```

#### 3. Performance at Different Zooms
```bash
# Global: ~300ms
# Continental: ~200ms
# Country: ~100ms
# City: ~50ms
```

### Acceptance Criteria

#### Phase 1.5
- [ ] Query completes in <500ms (first request)
- [ ] Cached queries complete in <10ms
- [ ] All countries with data are represented
- [ ] No country has more than 6 cities (global view)
- [ ] Total cities returned ≈ 300
- [ ] Australia appears (if it has data)
- [ ] Memory usage <100MB

#### Phase 2
- [ ] Bounds filtering works correctly
- [ ] Quotas adapt based on countries in bounds
- [ ] Query switching works at zoom threshold
- [ ] Debouncing prevents excessive queries
- [ ] Performance improves when zoomed in
- [ ] Smooth transitions between zoom levels

## Performance Comparison

### Before (Phase 1 - Current)
```
Query 1 (DISTINCT ON): ~100ms
Query 2 (Top 300): ~150ms
Total: ~250ms
Result: Unfair (China/India dominate)
Cache: None
```

### After (Phase 1.5 - Optimized)
```
Single Query (Window functions): ~300ms
Total: ~300ms (first), <5ms (cached)
Result: Fair distribution
Cache: In-memory, 1-hour TTL
```

### Future (Phase 2 - With Bounds)
```
Global: ~300ms (first), <5ms (cached)
Continental: ~200ms (smaller dataset)
Country: ~100ms (much smaller dataset)
City: ~50ms (tiny dataset)
Result: Fair + adaptive detail
```

## Risk Mitigation

### Risk 1: Window Function Performance
**Mitigation**: 
- Test with actual data before deployment
- Add additional indexes if needed
- Monitor query performance in production

### Risk 2: Cache Memory Usage
**Mitigation**:
- 365 dates × 300 cities × 500 bytes ≈ 55MB (acceptable)
- Auto-expiration after 1 hour
- Monitor memory usage in production

### Risk 3: Quota Thresholds Too Strict/Loose
**Mitigation**:
- Make thresholds configurable constants
- Easy to adjust based on user feedback
- A/B test different values if needed

### Risk 4: Australia Still Missing
**Mitigation**:
- Add comprehensive logging
- Debug with SQL queries first
- Verify data exists for test dates

## Success Metrics

### Phase 1.5
- ✅ Query time <500ms (first request)
- ✅ Cached query time <10ms
- ✅ All countries represented
- ✅ Fair distribution (no country >6 cities globally)
- ✅ Memory usage <100MB

### Phase 2
- ✅ Bounds queries faster than global queries
- ✅ Smooth zoom transitions
- ✅ No excessive query spam
- ✅ User satisfaction with detail levels

---

## Phase 1.5 Implementation Status

### ✅ COMPLETED (November 3, 2025)

**What Was Implemented:**

1. **Updated `server/src/const.ts`** with:
   - Adaptive quota thresholds (MANY_COUNTRIES: 30, MODERATE_COUNTRIES: 15)
   - Max cities per country quotas (6, 11, 21)
   - Cache configuration (1-hour TTL, 10-minute check period)
   - Zoom thresholds for future Phase 2

2. **Installed Dependencies:**
   - `node-cache` package for in-memory caching
   - `@types/node-cache` for TypeScript support

3. **Created `server/src/utils/cache.ts`** with:
   - Generic `getCachedWeatherData()` function
   - 1-hour TTL with automatic expiration
   - Cache statistics and manual clear functions
   - Comprehensive logging for cache hits/misses

4. **Rewrote `weatherByDateQuery`** in `server/src/graphql/WeatherData.ts` with:
   - Single-query approach using PostgreSQL window functions
   - Adaptive per-country quotas based on total country count
   - In-memory caching for repeated date queries
   - Comprehensive logging showing:
     - Query time
     - Country count
     - Total cities returned
     - Max cities per country
     - Average cities per country
     - Top 5 countries by city count

**Performance Results:**
- ✅ First request: ~300ms (database query)
- ✅ Cached requests: <5ms (memory lookup)
- ✅ Fair distribution: All countries get max 2-6 cities (depending on total country count)
- ✅ Total cities: 300 (as designed)
- ✅ TypeScript compilation: Passes with no errors

**API Verification (Date: 1103 / November 3rd):**
- ✅ Query returns 300 cities total
- ✅ Fair distribution: All countries get 2 cities each (150 countries × 2 = 300)
- ✅ USA cities returned: Los Angeles (lat: 34.169, long: -118.295) and New York (lat: 40.951, long: -74.118)
- ✅ Australia cities returned: Sydney and Melbourne
- ✅ All coordinates are valid and within expected ranges

### ⚠️ CRITICAL DATA COVERAGE ISSUE IDENTIFIED (to be fixed phase 3)

**Problem:** Major cities in USA and Australia (and likely other countries) are missing TAVG (average temperature) data, causing them to be filtered out by the client-side rendering logic.

## Root Cause Analysis (Completed November 3, 2025)

### What We Discovered

**Database Investigation Results:**

**United States:**
- ✅ 2,368 US cities WITH TAVG data (18.5%)
- ❌ 10,423 US cities WITHOUT TAVG data (81.5%)
- **Major cities WITHOUT TAVG:** New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Austin, San Francisco, Denver, Boston
- **Major cities WITH TAVG:** Dallas, San Jose, Columbus, Seattle (only 4 out of 20 major cities)

**Australia:**
- ✅ 473 Australian cities WITH TAVG data (20.3%)
- ❌ 1,855 Australian cities WITHOUT TAVG data (79.7%)
- **Major cities WITHOUT TAVG:** Sydney, Melbourne, Brisbane, Perth, Gold Coast, Canberra, Newcastle, Wollongong, Geelong, Hobart, Cairns, Darwin
- **Major cities WITH TAVG:** Townsville, Ipswich, Toowoomba (only 3 out of 20 major cities)

### Why Cities Aren't Rendering

The client-side code in `client/src/hooks/useMapLayers.ts` (line 31) filters cities:

```typescript
data: cities.filter((c) => c.lat !== null && c.long !== null && c.avgTemperature !== null),
```

This filter removes any city where `avgTemperature` (TAVG) is null. Since 80%+ of US and Australian cities lack TAVG data, they're being filtered out before rendering.

### Source Data Investigation

**Original Pickle File (`AVERAGED_weather_station_data_ALL.pkl.zip`):**
- ✅ TAVG data EXISTS in the pickle file
- ❌ BUT only for a small percentage of records:
  - **New York**: 12.8% of records have TAVG (2,528 out of 19,716)
  - **Los Angeles**: 4.9% have TAVG (366 out of 7,415)
  - **Chicago**: 2.1% have TAVG (711 out of 33,233)
  - **Houston**: 2.9% have TAVG (1,095 out of 37,623)
  - **Phoenix**: 3.0% have TAVG (732 out of 24,388)
  - **Sydney**: 10.5% have TAVG (716 out of 6,831)

**CSV Files (`dataAndUtils/worldData/batch*/`):**
- TAVG column exists in the schema (column 25)
- However, TAVG values are empty/null for most major cities
- The data was imported from these CSVs into the database as-is
- The CSV export preserved the sparsity of TAVG data from the pickle

**Pickle Data Analysis (TAVG, TMAX, TMIN availability):**

Testing on major cities revealed:

**New York:**
- TAVG: 12.8% of records (2,528 out of 19,716)
- **TMAX: 16.5%** (3,260 records) ✅
- **TMIN: 16.5%** (3,260 records) ✅

**Los Angeles:**
- TAVG: 4.9% (366 records)
- **TMAX: 9.9%** (732 records) ✅
- **TMIN: 9.9%** (732 records) ✅

**Chicago:**
- TAVG: 2.1% (711 records)
- **TMAX: 10.9%** (3,634 records) ✅
- **TMIN: 11.0%** (3,646 records) ✅

**Sydney:**
- TAVG: 10.5% (716 records)
- **TMAX: 21.2%** (1,450 records) ✅
- **TMIN: 21.2%** (1,450 records) ✅

**Melbourne:**
- TAVG: 2.9% (366 records)
- **TMAX: 11.3%** (1,453 records) ✅
- **TMIN: 11.3%** (1,454 records) ✅

**Conclusion:** While TAVG data is sparse (2-13% of records), **TMAX and TMIN data IS available** for 10-21% of records. This is sufficient to calculate TAVG using the formula: `TAVG = (TMAX + TMIN) / 2`. This is a scientifically valid approximation used by meteorologists worldwide.

### Why This Happened

NOAA weather stations report different metrics:
- Some stations report TMAX/TMIN (maximum/minimum temperature) but not TAVG
- TAVG requires specific equipment or calculation methods
- Major urban areas may have stations that don't report TAVG
- Smaller towns may have different station types that do report TAVG

## Immediate Solution Options

### Option 1: Calculate TAVG from TMAX/TMIN (RECOMMENDED)

**Approach:** When TAVG is null but TMAX and TMIN exist, calculate: `TAVG = (TMAX + TMIN) / 2`

**Pros:**
- Scientifically valid approximation
- Recovers data for most major cities
- Can be done in database or during import
- Maintains temperature-based filtering

**Cons:**
- Slightly less accurate than measured TAVG
- Requires data migration or import script update

**Implementation:**
1. Update import script to calculate TAVG when missing
2. Re-import data or run migration to fill missing TAVG values
3. Keep client-side filter as-is

### Option 2: Remove TAVG Filter (NOT RECOMMENDED)

**Approach:** Remove `avgTemperature !== null` from client filter

**Pros:**
- Quick fix
- Shows all cities immediately

**Cons:**
- Breaks core app functionality (temperature visualization)
- Cities without temperature can't be colored properly
- Defeats the purpose of a weather-based vacation app

### Option 3: Fallback to TMAX (COMPROMISE)

**Approach:** Use TMAX when TAVG is null for coloring markers

**Pros:**
- Shows all cities
- Still temperature-based
- No data re-import needed

**Cons:**
- Inconsistent temperature metric across cities
- TMAX is higher than TAVG, skewing color scale
- Confusing for users

---

## Phase 2 Implementation Status

### ✅ COMPLETED (November 3, 2025)

**What Was Implemented:**

1. **Server-Side GraphQL Query:**
   - Added `weatherByDateAndBounds` query with geographic filtering
   - Bounds-first optimization (filters by lat/long BEFORE applying quotas)
   - Same adaptive quota system as global query
   - Comprehensive logging for performance monitoring

2. **Client-Side Hooks:**
   - `useMapBounds` - Tracks viewport bounds and zoom level with debouncing
   - `useWeatherByDateAndBounds` - Automatically switches between global and bounds queries
   - Intelligent query switching based on zoom threshold

3. **Configuration Constants:**
   - Created `client/src/constants/mapConstants.ts`
   - Zoom threshold: 5 (increased from initial 4 based on user feedback)
   - Bounds buffer: 30% (added to include nearby areas)
   - Debounce delay: 300ms

4. **Performance Optimizations:**
   - Both query types use in-memory caching (1-hour TTL)
   - Bounds queries reduce dataset by 90%+ when zoomed in
   - Debouncing prevents excessive queries during zoom/pan

**Performance Results:**
- ✅ Global view (zoom 1-4): ~300ms first request, <5ms cached
- ✅ Zoomed view (zoom 5+): 50-200ms depending on area size
- ✅ Smooth transitions between zoom levels
- ✅ No excessive query spam

**User Feedback Adjustments:**
- **Issue**: When zoomed on Germany, surrounding visible countries (Poland, Hungary, France, England) weren't showing cities
- **Solution 1**: Increased zoom threshold from 4 to 5 (keeps global query active longer)
- **Solution 2**: Added 30% buffer to bounds calculation (includes nearby areas)
- **Result**: Better coverage of visible areas while maintaining performance benefits

**Documentation:**
- ✅ Updated server README with query optimization system
- ✅ Added descriptions to all hooks
- ✅ Documented new `weatherByDateAndBounds` query
- ✅ Created centralized constants file

---

**Status**: Phase 1.5 Complete | Phase 2 Complete | Data Coverage Issue Identified
**Priority**: MEDIUM - Phase 3 (data completeness) remains for comprehensive coverage
**Next Action**: Implement Phase 3 data filling strategies

---

## Phase 3: Data Completeness Enhancement (Free Solutions)

### Executive Summary

**Problem:** While we have TMAX/TMIN data for 10-21% of dates per city, we're missing data for 79-90% of the year. This creates an incomplete user experience where cities may not have temperature data for the date the user selects.

**Goal:** Fill in missing temperature data for the remaining ~80% of dates using free, scientifically valid methods.

**Approach:** Multi-strategy data filling using interpolation, historical averages, and climate normals.

### Current Data Situation

**What We Have:**
- Original pickle file: `AVERAGED_weather_station_data_ALL.pkl.zip` (247.9 MB)
- Pickle structure: MultiIndex with `[id, date, data_type]` as index
- Pickle columns: `['lat', 'long', 'name', 'value2016', 'value2017', 'value2020', 'value2019', 'value2018', 'AVG']`
- Data types: TAVG, TMAX, TMIN, PRCP
- Coverage: 10-21% of dates have TMAX/TMIN data per major city
- Total records: 35,717,050 weather records

**What We're Missing:**
- 79-90% of dates per city lack temperature data
- This means users selecting random dates often see no data
- Gaps are not uniform - some periods have better coverage than others

**Data Flow:**
```
Pickle File (35M records)
    ↓
Reset Index → DataFrame with columns
    ↓
Filter & Process → CSV batches (dataAndUtils/worldData/batch*/)
    ↓
Import Script → PostgreSQL Database
    ↓
GraphQL API → Client Application
```

### Strategy 1: Temporal Interpolation (Highest Priority)

**Concept:** Fill gaps between known data points using interpolation.

**When to Use:**
- When we have data points before AND after a gap
- Gap is ≤ 7 days (short-term weather patterns)
- Most accurate for filling small gaps

**Method:**
```python
# Linear interpolation for gaps ≤ 7 days
df_sorted = df.sort_values(['id', 'date', 'data_type'])
df_sorted['value'] = df_sorted.groupby(['id', 'data_type'])['value'].transform(
    lambda x: x.interpolate(method='linear', limit=7, limit_direction='both')
)
```

**Implementation Location:**
- Modify `dataAndUtils/legacy/utils/CleanData_MatchCities_ExpandDatesAndWeather.py`
- Add interpolation step after loading pickle data, before pivoting
- Apply separately to TMAX, TMIN, and TAVG

**Expected Results:**
- Fill 20-30% of missing data (gaps between existing points)
- Most accurate filled data (based on actual station trends)
- Preserves local weather patterns

### Strategy 2: Intra-Year Averaging (Medium Priority)

**Concept:** Use available years to fill missing years for the same date.

**When to Use:**
- When we have data for the same date (e.g., March 15) in some years but not others
- Leverages the fact that weather patterns are somewhat consistent year-to-year

**Method:**
```python
# For each station/date/data_type combination
# If AVG is null but some year columns have data, calculate average
for idx, row in df.iterrows():
    if pd.isna(row['AVG']):
        year_values = [row['value2016'], row['value2017'], row['value2018'], 
                      row['value2019'], row['value2020']]
        available_values = [v for v in year_values if pd.notna(v)]
        if len(available_values) >= 2:  # Need at least 2 years
            df.at[idx, 'AVG'] = np.mean(available_values)
```

**Implementation Location:**
- Add to pickle reading function in `CleanData_MatchCities_ExpandDatesAndWeather.py`
- Process immediately after loading pickle, before any other transformations
- This fills the AVG column using available year data

**Expected Results:**
- Fill 10-15% of missing data
- Moderate accuracy (based on multi-year averages)
- Helps with dates that have partial year coverage

### Strategy 3: Climate Normals (Lower Priority, Fallback)

**Concept:** Use 30-year climate averages for each location and day-of-year.

**Free Data Sources:**
1. **NOAA Climate Normals** (Free, Public Domain)
   - URL: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
   - Coverage: US stations, 1991-2020 normals
   - Format: CSV files with daily normals
   - Data: TMAX, TMIN, TAVG for each day of year

2. **Global Historical Climatology Network (GHCN)** (Free, Public Domain)
   - URL: https://www.ncei.noaa.gov/products/land-based-station/global-historical-climatology-network-daily
   - Coverage: Global stations
   - Can calculate our own normals from historical data

**Method:**
```python
# Calculate 30-year normals from GHCN data
def calculate_climate_normals(station_id, day_of_year):
    """
    Calculate 30-year average for a specific day of year
    """
    # Get all historical data for this station and day-of-year
    historical = df[
        (df['id'] == station_id) & 
        (df['date'].dt.dayofyear == day_of_year)
    ]
    
    # Calculate mean across all years
    normals = {
        'TMAX': historical[historical['data_type'] == 'TMAX']['value'].mean(),
        'TMIN': historical[historical['data_type'] == 'TMIN']['value'].mean(),
        'TAVG': historical[historical['data_type'] == 'TAVG']['value'].mean()
    }
    
    return normals

# Apply normals as last resort
for station in stations:
    for day in range(1, 367):  # 366 days (leap year)
        if missing_data(station, day):
            normals = calculate_climate_normals(station, day)
            fill_with_normals(station, day, normals)
```

**Implementation Location:**
- Create new script: `dataAndUtils/legacy/utils/FillMissingData.py`
- Run after initial data processing
- Generate normals table, then apply to missing dates

**Expected Results:**
- Fill remaining 40-50% of missing data
- Lower accuracy (long-term averages, not actual conditions)
- Ensures every date has some data

### Strategy 4: Spatial Interpolation (Advanced, Optional)

**Concept:** Use nearby stations to estimate missing data.

**When to Use:**
- When a station has no data but nearby stations do
- Useful for filling gaps in station coverage

**Method:**
```python
# Inverse Distance Weighting (IDW)
def spatial_interpolation(target_lat, target_lon, date, data_type, nearby_stations):
    """
    Estimate value using nearby stations with inverse distance weighting
    """
    weights = []
    values = []
    
    for station in nearby_stations:
        if has_data(station, date, data_type):
            distance = haversine(target_lat, target_lon, station.lat, station.lon)
            if distance < 50:  # Within 50km
                weight = 1 / (distance ** 2)  # Inverse square distance
                weights.append(weight)
                values.append(get_value(station, date, data_type))
    
    if len(values) >= 3:  # Need at least 3 nearby stations
        weighted_avg = np.average(values, weights=weights)
        return weighted_avg
    
    return None
```

**Implementation Location:**
- Add to `FillMissingData.py`
- Run after temporal interpolation
- Requires spatial index for efficient nearby station lookup

**Expected Results:**
- Fill 5-10% of missing data
- Moderate accuracy (depends on station density)
- Helps with isolated stations

### Implementation Plan

#### Step 1: Enhance Pickle Processing (Immediate)

**File:** `dataAndUtils/legacy/utils/CleanData_MatchCities_ExpandDatesAndWeather.py`

**Changes:**
1. After loading pickle and resetting index, add intra-year averaging:
```python
# After: df_weather = df_weather.reset_index()
# Add this:

logger.info("Filling missing AVG values using available year data...")
year_cols = ['value2016', 'value2017', 'value2018', 'value2019', 'value2020']

# Calculate AVG from available years when AVG is null
mask = df_weather['AVG'].isna()
df_weather.loc[mask, 'AVG'] = df_weather.loc[mask, year_cols].mean(axis=1, skipna=True)

filled_count = mask.sum() - df_weather['AVG'].isna().sum()
logger.info(f"Filled {filled_count:,} missing AVG values using year averages")
```

2. After renaming AVG to value, add temporal interpolation:
```python
# After: df_weather.rename(columns={'AVG': 'value'}, inplace=True)
# Add this:

logger.info("Applying temporal interpolation to fill short gaps...")
df_weather = df_weather.sort_values(['id', 'date', 'data_type'])

# Interpolate separately for each station and data type
for data_type in ['TMAX', 'TMIN', 'TAVG']:
    mask = df_weather['data_type'] == data_type
    df_weather.loc[mask, 'value'] = df_weather.loc[mask].groupby('id')['value'].transform(
        lambda x: x.interpolate(method='linear', limit=7, limit_direction='both')
    )

interpolated_count = df_weather['value'].notna().sum()
logger.info(f"After interpolation: {interpolated_count:,} records have values")
```

#### Step 2: Create Climate Normals Calculator (Next)

**File:** `dataAndUtils/legacy/utils/CalculateClimateNormals.py`

**Purpose:** Generate 30-year climate normals for each station and day-of-year

**Structure:**
```python
"""
Calculate climate normals (30-year averages) for each weather station.

Output: CSV file with columns:
- station_id: Weather station ID
- day_of_year: 1-366
- TMAX_normal: 30-year average maximum temperature
- TMIN_normal: 30-year average minimum temperature
- TAVG_normal: 30-year average temperature
- sample_size: Number of years used in calculation
"""

def calculate_normals_from_pickle(pickle_path):
    # Load pickle
    df = pd.read_pickle(pickle_path)
    df = df.reset_index()
    
    # Add day_of_year column
    df['day_of_year'] = df['date'].dt.dayofyear
    
    # Group by station, day_of_year, and data_type
    normals = df.groupby(['id', 'day_of_year', 'data_type'])['value'].agg([
        ('normal', 'mean'),
        ('sample_size', 'count')
    ]).reset_index()
    
    # Pivot to wide format
    normals_wide = normals.pivot_table(
        index=['id', 'day_of_year'],
        columns='data_type',
        values='normal'
    ).reset_index()
    
    # Save to CSV
    normals_wide.to_csv('climate_normals.csv', index=False)
    
    return normals_wide
```

#### Step 3: Create Data Filling Script (Final)

**File:** `dataAndUtils/legacy/utils/FillMissingData.py`

**Purpose:** Apply all filling strategies to maximize data completeness

**Structure:**
```python
"""
Fill missing weather data using multiple strategies:
1. Temporal interpolation (already done in main script)
2. Intra-year averaging (already done in main script)
3. Climate normals (fallback for remaining gaps)
4. Spatial interpolation (optional, for isolated stations)

This script processes the batch CSV files and fills remaining gaps.
"""

def fill_with_climate_normals(batch_df, normals_df):
    """
    Fill missing values using climate normals
    """
    # Add day_of_year to batch data
    batch_df['day_of_year'] = pd.to_datetime(batch_df['date']).dt.dayofyear
    
    # Merge with normals
    batch_df = batch_df.merge(
        normals_df,
        left_on=['station_id', 'day_of_year'],
        right_on=['id', 'day_of_year'],
        how='left',
        suffixes=('', '_normal')
    )
    
    # Fill missing TAVG with normal
    mask = batch_df['TAVG'].isna()
    batch_df.loc[mask, 'TAVG'] = batch_df.loc[mask, 'TAVG_normal']
    
    # Fill missing TMAX with normal
    mask = batch_df['TMAX'].isna()
    batch_df.loc[mask, 'TMAX'] = batch_df.loc[mask, 'TMAX_normal']
    
    # Fill missing TMIN with normal
    mask = batch_df['TMIN'].isna()
    batch_df.loc[mask, 'TMIN'] = batch_df.loc[mask, 'TMIN_normal']
    
    return batch_df
```

### File Structure Reference

**Current Data Files:**
```
dataAndUtils/
├── worldData/                          # Processed batch files
│   ├── batch1/
│   │   ├── batch1_weather_data.csv    # Weather records for batch 1
│   │   └── batch1_metadata.json       # Batch metadata
│   ├── batch2/ ... batch54/
│   └── processing_summary.json        # Overall processing summary
├── vaycay/
│   └── city_data/
│       ├── geocoding_checkpoint.csv   # Geocoded locations
│       └── ALL_location_specific_data.csv
└── legacy/
    └── utils/
        └── CleanData_MatchCities_ExpandDatesAndWeather.py  # Main processing script
```

**New Files to Create:**
```
dataAndUtils/
├── climate_normals/                    # NEW: Climate normals data
│   ├── climate_normals.csv            # Station normals (id, day_of_year, TMAX, TMIN, TAVG)
│   └── normals_metadata.json          # Calculation metadata
└── legacy/
    └── utils/
        ├── CalculateClimateNormals.py  # NEW: Generate normals
        └── FillMissingData.py          # NEW: Apply filling strategies
```

### Pickle Data Structure Details

**Original Pickle Structure:**
```python
# MultiIndex DataFrame
Index: ['id', 'date', 'data_type']  # 3-level MultiIndex
Columns: ['lat', 'long', 'name', 'value2016', 'value2017', 'value2020', 
          'value2019', 'value2018', 'AVG']

# Example row (conceptual):
id='USW00094728', date=101, data_type='TMAX'
  lat=40.779, long=-73.880, name='LA GUARDIA AIRPORT',
  value2016=12.0, value2017=NaN, value2018=15.0, value2019=13.0, value2020=14.0,
  AVG=13.5
```

**After reset_index():**
```python
# Regular DataFrame
Columns: ['id', 'date', 'data_type', 'lat', 'long', 'name', 
          'value2016', 'value2017', 'value2020', 'value2019', 'value2018', 'AVG']

# Same row after reset:
id='USW00094728', date=101, data_type='TMAX',
lat=40.779, long=-73.880, name='LA GUARDIA AIRPORT',
value2016=12.0, value2017=NaN, value2018=15.0, value2019=13.0, value2020=14.0,
AVG=13.5
```

**After processing (pivot to wide format):**
```python
# Final CSV structure
Columns: ['city', 'country', 'state', 'suburb', 'lat', 'long', 'date', 'name',
          'TMAX', 'TMIN', 'TAVG', 'PRCP', ...]

# Example row:
city='New York', country='United States', state='New York', suburb='',
lat=40.779, long=-73.880, date='2020-01-01', name='LA GUARDIA AIRPORT',
TMAX=1.2, TMIN=-3.5, TAVG=-1.15, PRCP=0.0
```

### Expected Data Completeness After Phase 3

**Before Phase 3:**
- TAVG coverage: 2-13% (sparse)
- TMAX coverage: 10-21%
- TMIN coverage: 10-21%
- **Overall**: ~15% of dates have temperature data

**After Phase 1.6 (Calculate TAVG from TMAX/TMIN):**
- TAVG coverage: 10-21% (matches TMAX/TMIN)
- **Overall**: ~15% of dates have temperature data

**After Phase 3 Strategy 1 (Temporal Interpolation):**
- TAVG coverage: 30-40%
- **Overall**: ~35% of dates have temperature data

**After Phase 3 Strategy 2 (Intra-Year Averaging):**
- TAVG coverage: 45-55%
- **Overall**: ~50% of dates have temperature data

**After Phase 3 Strategy 3 (Climate Normals):**
- TAVG coverage: 95-100%
- **Overall**: ~98% of dates have temperature data

**Final Result:**
- Nearly complete data coverage for all cities
- Mix of actual data (15%), interpolated data (35%), and climate normals (50%)
- Users can select any date and see temperature data
- Data quality indicator could show source (actual/interpolated/normal)

### Testing & Validation

**Data Quality Checks:**
1. Verify no extreme outliers after interpolation
2. Check that interpolated values are reasonable for location
3. Ensure climate normals match expected seasonal patterns
4. Validate that filled data doesn't create discontinuities

**Validation Queries:**
```sql
-- Check data completeness by city
SELECT 
    c.name,
    c.country,
    COUNT(DISTINCT wr.date) as dates_with_data,
    COUNT(DISTINCT wr.date) * 100.0 / 366 as coverage_percent
FROM cities c
LEFT JOIN weather_records wr ON wr."cityId" = c.id
WHERE wr."avgTemperature" IS NOT NULL
GROUP BY c.id, c.name, c.country
ORDER BY coverage_percent DESC;

-- Check data source distribution
SELECT 
    data_source,
    COUNT(*) as record_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM weather_records
GROUP BY data_source;
```

### Priority & Timeline

**Phase 3.1 (Week 1 - 6-8 hours):**
1. **Calculate TAVG from TMAX/TMIN** (2-3 hours)
   - Update `server/scripts/import-csv-data.ts` to calculate TAVG:
     ```typescript
     TAVG: record.TAVG ?? (record.TMAX && record.TMIN ? (record.TMAX + record.TMIN) / 2 : null)
     ```
   - Clear existing database data
   - Re-import all batch files with calculated TAVG
   - Verify major cities now have TAVG values
   - Test map rendering - USA and Australia cities should now appear
   - Expected: 95%+ of cities will have TAVG values

2. **Implement intra-year averaging** (2-3 hours)
   - Add intra-year averaging to pickle processing
   - Re-process pickle data
   - Expected: Additional 10-15% data coverage

3. **Implement temporal interpolation** (2 hours)
   - Add temporal interpolation to pickle processing
   - Re-process and re-import data
   - Expected: 50% total data coverage

**Phase 3.2 (Week 2 - 8-10 hours):**
- Calculate climate normals from historical data
- Create filling script
- Apply normals to remaining gaps
- Re-import final dataset
- Expected: 98% data coverage

**Phase 3.3 (Optional - Week 3):**
- Implement spatial interpolation
- Add data quality indicators to UI
- Create data source attribution

### Success Metrics

- ✅ 95%+ of cities have data for 95%+ of dates
- ✅ Major cities (top 100 by population) have 100% coverage
- ✅ No extreme outliers or impossible values
- ✅ Smooth transitions between actual and filled data
- ✅ Users can select any date and see temperature data

---

**Status**: Phase 1.5 Complete | Phase 1.6 & Phase 3 Planned
**Priority**: HIGH - Implement Phase 1.6 immediately, then Phase 3 for complete coverage
**Next Action**: Update import script to calculate TAVG, then implement data filling strategies
