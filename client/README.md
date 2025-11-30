# Vaycay Client

## Map Marker Distribution Logic

### Viewport Bounds Calculation
- `useMapBounds` calculates visible geographic bounds using Web Mercator projection
- Uses precise decimal bounds (not rounded to integers)
- 50% buffer added to include nearby cities
- Bounds sent as Float type to GraphQL API

### Query Switching
- **Zoom < 2**: Global query (all countries, equal distribution with area bonus)
- **Zoom ≥ 2**: Bounds query (only visible region, same distribution logic)

### Distribution Strategy (server: `weatherQueries.ts`)

Both global and zoomed views use the same algorithm:
- **Base allocation**: Equal distribution across all countries (~1.6 cities per country for 300 cities / 187 countries)
- **Area bonus**: Additional 20% of budget distributed proportionally by country area (using square root to reduce dominance)
- **Result**: Balanced global representation - no single country dominates (e.g., France now gets ~2-3 cities instead of 57)

### Known Issue: Zoomed Viewport Coverage
The equal distribution algorithm that fixes global balance creates smaller viewport coverage when zoomed. For example, when I zoom in and can see Denmark to Zambia (north to south) and Brazil to Iran (west to east), the marker dots are clearly only populated in a box that reaches from the azores (west), across the middle of spain (north), down from the western side of turkey (east), and across southern Chad/northern Ghana in that line across the south. That is a very small window compared to the countries I CAN see on the map. 
- **Root cause**: When zoomed to show 5-10 countries, equal distribution still gives each country only 1-2 cities in a clear square in the middle of the screen. 
- **Trade-off**: Global balance (fixed ✅) vs zoomed density (reduced ❌)
- **Potential solution**: Use different algorithm for bounds queries (grid-based instead of country-based)

### Client-Side Limiting
- `useMapLayers` applies `maxCitiesToShow` (300) to prevent performance issues
- Color caching pre-calculates markers to improve render performance

## Rainfall Data Normalization

### Background
The backend aggregates multiple years of daily weather data into weekly statistics. Different cities have varying amounts of historical data:
- Berlin, Germany: 2 years (732 days)
- Hamburg, Germany: 1 year (366 days)
- Some cities: 50+ years of data

### The Problem
Without normalization, `totalPrecip` for each week represents the **sum of precipitation across all available years** for that week. This causes:
- Cities with more historical data to show artificially inflated precipitation values
- Inaccurate comparisons between cities (e.g., Berlin showing 2x Hamburg's rainfall)
- Incorrect annual totals (Berlin showing 1038mm instead of ~518mm)

### The Solution: Normalization Formula
To get accurate average weekly precipitation regardless of years of data:

```typescript
normalizedWeeklyPrecip = (totalPrecip / daysWithData) * 7
```

**How it works:**
1. `totalPrecip / daysWithData` = average daily precipitation for that week
2. Multiply by 7 = average weekly precipitation
3. Sum all 52 weeks = accurate annual rainfall

### Implementation Locations
1. **Annual Rainfall Display** ([SunshineValues.tsx](src/components/CityPopup/SunshineValues.tsx))
   - Uses `calculateAverageRainfall()` utility
   - Shows total annual rainfall in mm

2. **Weekly Rainfall Graph** ([RainfallGraph.tsx](src/components/CityPopup/graphs/RainfallGraph.tsx))
   - Normalizes both main city and comparison city data
   - Displays average weekly precipitation per week
   - Enables accurate side-by-side city comparisons

### Validation
Database verification for Berlin:
- Raw sum of `totalPrecip`: 1038mm (inflated by 2 years of data)
- Normalized calculation: 517.7mm ✅
- Ground truth from daily data: 518mm ✅

The normalization ensures all cities display accurate, comparable precipitation values regardless of their historical data availability.
