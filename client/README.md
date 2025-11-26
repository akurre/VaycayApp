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
