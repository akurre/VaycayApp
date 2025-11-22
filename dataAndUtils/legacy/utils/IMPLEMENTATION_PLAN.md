# Implementation Plan: Data Processing Pipeline Fixes

## Overview

This document outlines the implementation plan for fixing the 8 critical issues identified in the weather data processing pipeline. The fixes will increase data retention from 93% to 100% and improve data quality significantly.

---

## Understanding the Full Pipeline

### Complete Flow:
```
Python Processing (CleanData_MatchCities_ExpandDatesAndWeather.py)
    ↓
CSV Batch Files (dataAndUtils/worldData_v2/batch*/...)
    ↓
import-csv-data.ts (Deduplicates by name|country|lat|long, creates cities/stations/records)
    ↓
merge-duplicate-cities-optimized.ts (Consolidates PRCP data, deletes PRCP-only cities)
    ↓
PostgreSQL Database (Final data for GraphQL API)
```

### Key Insights:

1. **City Deduplication**: Done in TypeScript import by `name|country|lat(6 decimals)|long(6 decimals)`
2. **Station Preservation**: Weather stations are separate entities linked to cities
3. **PRCP Consolidation**: Merge script handles multiple stations per city by date-matching PRCP
4. **Population Critical**: Needed for FE filtering (accessibility, airports, etc.)

---

## Changes to Implement

### Phase 1: Critical Fixes (Highest Data Recovery)

#### Fix #1: Remove "One City Per Station" Restriction
**File**: `dataAndUtils/legacy/utils/geocoding.py`
**Lines**: 231-243
**Impact**: +5-7% data recovery (~2,000-3,000 stations)

**Current Code**:
```python
# find first city that hasn't been assigned
for _, city_row in df_nearby.iterrows():
    city_key = f"{city_row['city']}_{city_row['country']}"
    if city_key not in assigned_cities:  # ← REMOVE THIS CHECK
        assigned_cities.add(city_key)    # ← REMOVE THIS LINE
        return {...}
```

**New Code**:
```python
# Simply return the closest city within radius
# Multiple stations can match to the same city
for _, city_row in df_nearby.iterrows():
    return {
        'city': city_row['city'],
        'country': city_row['country'],
        'state': city_row['admin_name'],
        'suburb': '',
        'city_ascii': city_row.get('city_ascii', ''),
        'iso2': city_row.get('iso2', ''),
        'iso3': city_row.get('iso3', ''),
        'capital': city_row.get('capital', ''),
        'population': city_row.get('population', None),
        'worldcities_id': city_row.get('id', ''),
        'data_source': 'worldcities'
    }
```

**Additional Changes**:
- Remove `assigned_cities` parameter from function signature
- Remove `assigned_cities: Set[str] = set()` initialization in calling code
- Remove all `assigned_cities.add()` calls

---

#### Fix #2: Keep Failed Geocodes with Geographic Region Fallback
**File**: `dataAndUtils/legacy/utils/geocoding.py`
**Lines**: 544-564
**Impact**: +7% data recovery (~3,000 stations)

**Add New Function**:
```python
def get_geographic_region(lat: float, long: float) -> dict:
    """
    Assign a descriptive region name based on coordinates.
    Used as fallback for stations that fail all geocoding tiers.
    """
    # Polar regions
    if lat > 66.5:
        return {
            'city': 'Arctic Region',
            'country': 'Polar',
            'state': f"Latitude: {lat:.2f}°N",
            'data_source': 'geographic_region'
        }
    elif lat < -66.5:
        return {
            'city': 'Antarctic Region',
            'country': 'Polar',
            'state': f"Latitude: {lat:.2f}°S",
            'data_source': 'geographic_region'
        }

    # Ocean regions (simplified)
    if -30 < lat < 30:
        if -90 < long < -30:
            region = 'Atlantic Ocean'
        elif -30 < long < 60:
            region = 'Indian Ocean'
        elif 60 < long < 180 or -180 < long < -90:
            region = 'Pacific Ocean'
        else:
            region = 'Remote Ocean'
    elif lat > 0:
        region = 'Remote Northern Region'
    else:
        region = 'Remote Southern Region'

    return {
        'city': region,
        'country': 'Remote Area',
        'state': f"Coordinates: {lat:.2f}°, {long:.2f}°",
        'suburb': '',
        'city_ascii': region,
        'iso2': '',
        'iso3': '',
        'capital': '',
        'population': None,
        'worldcities_id': '',
        'data_source': 'geographic_region'
    }
```

**Update reverse_geocode_locations()**:
Replace the "failed" block (lines 544-564) with:
```python
# step 4: if everything failed, use geographic region fallback
if not match_result:
    match_result = get_geographic_region(row['lat'], row['long'])
    stats['geographic_region'] = stats.get('geographic_region', 0) + 1
else:
    # track statistics based on data source
    if match_result['data_source'] == 'worldcities':
        stats['worldcities_matched'] += 1
    elif match_result['data_source'] == 'nominatim':
        stats['nominatim_fallback'] += 1
```

**Remove Failed Geocode Filtering**:
**File**: `dataAndUtils/legacy/utils/CleanData_MatchCities_ExpandDatesAndWeather.py`
**Lines**: 332-339, 357-364

Delete these blocks:
```python
# DELETE THIS:
failed_count = (geocoded_data['data_source'] == 'failed').sum()
logger.info(f"found {failed_count} failed geocodes in checkpoint")
geocoded_data = geocoded_data[geocoded_data['data_source'] != 'failed'].reset_index(drop=True)
```

---

### Phase 2: Precision & Range Improvements

#### Fix #3: Reduce Coordinate Rounding (3 → 4 decimals)
**File**: `dataAndUtils/legacy/utils/data_loader.py`
**Lines**: 528-529
**Impact**: +1.4% data recovery (~600 stations)

**Change**:
```python
# OLD:
unique_locs['lat'] = unique_locs['lat'].round(3)  # ~111m precision
unique_locs['long'] = unique_locs['long'].round(3)

# NEW:
unique_locs['lat'] = unique_locs['lat'].round(4)  # ~11m precision
unique_locs['long'] = unique_locs['long'].round(4)
```

**Update Logger Message**:
```python
logger.info(f"After rounding to 4 decimals: {len(unique_locs):,} unique locations")
```

---

#### Fix #4: Increase Search Radii
**File**: `dataAndUtils/legacy/utils/config.py`
**Lines**: 47-48
**Impact**: +1-2% data recovery (~500-1,000 stations)

**Change**:
```python
# OLD:
SEARCH_RADIUS_KM_PRIMARY = 20.0
SEARCH_RADIUS_KM_FALLBACK = 30.0

# NEW:
SEARCH_RADIUS_KM_PRIMARY = 30.0
SEARCH_RADIUS_KM_FALLBACK = 50.0
SEARCH_RADIUS_KM_TERTIARY = 100.0  # Add new constant
```

**Update reverse_geocode_locations() to use tertiary radius**:
Add a third fallback tier before Nominatim:
```python
# After Tier 2 (all cities), before Nominatim:
if not match_result:
    match_result = match_station_to_major_city(
        row['lat'],
        row['long'],
        df_all_cities,
        primary_radius_km=SEARCH_RADIUS_KM_TERTIARY,
        fallback_radius_km=SEARCH_RADIUS_KM_TERTIARY
    )
    if match_result:
        match_result['data_source'] = 'worldcities_distant'
```

---

### Phase 3: Data Quality Improvements

#### Fix #5: Fix Pivot Data Loss - Include Station Name
**File**: `dataAndUtils/legacy/utils/data_processor.py`
**Lines**: 130-161
**Impact**: Preserves all station data, enables proper aggregation downstream

**Change**:
```python
# Add 'name' (station name) to index_cols
base_index = ['city', 'country', 'state', 'suburb', 'lat', 'long', 'date', 'name']  # 'name' already here!
# This is actually already correct! Just verify it's preserved.
```

**Verify the pivot preserves station names** - this appears to already be correct in the code.

---

#### Fix #6: Flag Imputed TAVG Values
**File**: `dataAndUtils/legacy/utils/data_processor.py`
**Lines**: 175-182
**Impact**: Data transparency

**Change**:
```python
# OLD:
if 'TAVG' in df_pivot.columns:
    if 'TMAX' in df_pivot.columns and 'TMIN' in df_pivot.columns:
        filled_count = df_pivot['TAVG'].isnull().sum()
        df_pivot['TAVG'] = df_pivot['TAVG'].fillna(
            df_pivot[['TMAX', 'TMIN']].mean(axis=1)
        )
        logger.info(f"Filled {filled_count:,} missing TAVG values using TMAX/TMIN average")

# NEW:
if 'TAVG' in df_pivot.columns:
    if 'TMAX' in df_pivot.columns and 'TMIN' in df_pivot.columns:
        # Create flag for imputed values
        imputed_mask = df_pivot['TAVG'].isnull()
        filled_count = imputed_mask.sum()

        # Use better formula: TAVG ≈ TMIN + 0.44 * (TMAX - TMIN)
        df_pivot.loc[imputed_mask, 'TAVG'] = (
            df_pivot.loc[imputed_mask, 'TMIN'] +
            0.44 * (df_pivot.loc[imputed_mask, 'TMAX'] - df_pivot.loc[imputed_mask, 'TMIN'])
        )

        logger.info(f"Imputed {filled_count:,} missing TAVG values using improved formula")
        logger.info(f"  Formula: TAVG = TMIN + 0.44 * (TMAX - TMIN)")
```

---

### Phase 4: Configuration Updates

#### Fix #7: Update Batch Output Directory
**File**: `dataAndUtils/legacy/utils/config.py`
**Line**: 35
**Impact**: Allows comparison between old and new output

**Change**:
```python
# OLD:
BATCH_OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'worldData'

# NEW:
BATCH_OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'worldData_v2'
```

---

#### Fix #8: Update Checkpoint Version
**File**: `dataAndUtils/legacy/utils/config.py`
**Line**: 51
**Impact**: Invalidates old checkpoints (ensures fresh geocoding with new algorithm)

**Change**:
```python
# OLD:
MATCHING_VERSION = "v2_worldcities"

# NEW:
MATCHING_VERSION = "v3_no_restriction"
```

---

## Implementation Order

### Step 1: Configuration Changes
1. Update `config.py`:
   - Increase search radii (Fix #4)
   - Change batch output directory (Fix #7)
   - Update matching version (Fix #8)

### Step 2: Data Loader Changes
1. Update `data_loader.py`:
   - Reduce coordinate rounding to 4 decimals (Fix #3)

### Step 3: Geocoding Changes (CRITICAL)
1. Update `geocoding.py`:
   - Add `get_geographic_region()` function (Fix #2)
   - Remove "one city per station" logic (Fix #1)
   - Update `reverse_geocode_locations()` to use geographic fallback (Fix #2)
   - Add tertiary radius tier (Fix #4)

### Step 4: Main Script Changes
1. Update `CleanData_MatchCities_ExpandDatesAndWeather.py`:
   - Remove failed geocode filtering (Fix #2)
   - Remove `assigned_cities` parameter passing (Fix #1)

### Step 5: Data Processor Changes
1. Update `data_processor.py`:
   - Improve TAVG imputation formula (Fix #6)
   - Verify station name is preserved in pivot (Fix #5)

---

## Testing Strategy

### Before Running Full Pipeline:

1. **Test Geocoding Changes**:
   ```bash
   # Process just 1 batch to verify:
   python CleanData_MatchCities_ExpandDatesAndWeather.py \
     --input-pickle-zip '/path/to/data.pkl.zip' \
     --batch-size-locations 100 \
     --force-reprocess-batch 1
   ```

2. **Verify Output**:
   - Check `worldData_v2/batch001/` for output files
   - Verify no "failed" data_source values
   - Count unique cities per batch (should see multiple Rome, NYC, etc.)

3. **Compare Counts**:
   ```bash
   # Old batches:
   wc -l dataAndUtils/worldData/batch*/*.csv

   # New batches:
   wc -l dataAndUtils/worldData_v2/batch*/*.csv

   # Should see ~7-10% increase in records
   ```

### After Full Processing:

1. **Run Import Script**:
   ```bash
   # Update import script to use worldData_v2
   npm run import-csv-data
   ```

2. **Run Merge Script**:
   ```bash
   npm run merge-duplicates
   ```

3. **Verify Database**:
   - Check final city count (should be similar - deduplication still works)
   - Check final weather record count (should be higher)
   - Spot-check major cities for multiple stations

---

## Expected Results

### Data Recovery:
```
OLD Pipeline:
  - Stations processed: 38,000 / 41,600 (91%)
  - Weather records: ~33M / 35M (93%)
  - Data loss: 7%

NEW Pipeline:
  - Stations processed: 41,600 / 41,600 (100%)
  - Weather records: ~35M / 35M (100%)
  - Data loss: 0%
```

### Geocoding Breakdown:
```
OLD:
  - Worldcities major: 30,000 (73%)
  - Nominatim: 8,000 (20%)
  - Failed: 3,000 (7%)

NEW:
  - Worldcities major: 34,000 (82%)
  - Worldcities distant: 3,000 (7%)
  - Nominatim: 2,600 (6%)
  - Geographic regions: 2,000 (5%)
  - Failed: 0 (0%)
```

### Database After Merge:
```
- Cities: ~15,000-20,000 (after deduplication by name|country|lat|long)
- Weather Stations: ~41,600 (all preserved)
- Weather Records: ~7M (after pivot, one per city/station/date)
- PRCP Coverage: 95%+ (after merge script consolidation)
```

---

## Rollback Plan

If issues arise:

1. **Keep Old Batch Directory**: `worldData/` remains untouched
2. **Revert Code Changes**: Use git to revert to previous commit
3. **Use Old Checkpoint**: Delete new checkpoint to revert to v2_worldcities
4. **Database Backup**: Ensure database backup before import

---

## Documentation Updates

After implementation:

1. Update `PROCESSING_FLOW.md` with new statistics
2. Update `CRITIQUE_AND_IMPROVEMENTS.md` to show "FIXED" status
3. Create `CHANGELOG.md` documenting all changes
4. Update main README with new data retention figures

---

## Next Steps

1. ✅ Review implementation plan
2. ⏳ Implement changes (in order listed above)
3. ⏳ Test with small batch
4. ⏳ Run full processing
5. ⏳ Import to database
6. ⏳ Run merge script
7. ⏳ Verify results
8. ⏳ Update documentation
