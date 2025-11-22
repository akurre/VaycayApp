# Weather Data Processing Pipeline - Technical Documentation

## Overview

This document provides a comprehensive technical overview of the weather data processing pipeline in `CleanData_MatchCities_ExpandDatesAndWeather.py` and its supporting modules. This pipeline transforms raw weather station data into city-based weather records suitable for the Vaycay application.

---

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [Data Flow](#data-flow)
3. [Module Descriptions](#module-descriptions)
4. [Processing Steps](#processing-steps)
5. [Data Structures](#data-structures)
6. [Configuration Parameters](#configuration-parameters)
7. [Checkpoint and Resume Capability](#checkpoint-and-resume-capability)

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CleanData_MatchCities_ExpandDatesAndWeather.py (Main Script)  │
│                        [18 KB]                                   │
│  • Command-line interface                                        │
│  • Orchestrates all modules                                      │
│  • Main execution flow                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┬────────────────┐
             │              │              │              │                │
             ▼              ▼              ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  config.py   │ │data_loader.py│ │ geocoding.py │ │data_processor│ │batch_manager │
     │   [3.2 KB]   │ │   [8.7 KB]   │ │   [26 KB]    │ │   [10 KB]    │ │   [6.4 KB]   │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## Data Flow

### High-Level Flow

```
INPUT DATA (35M records)
    │
    ├─► Step 1: Load & Prepare Data
    │   └─ Pickle/CSV → DataFrame (id, date, data_type, lat, long, name, value)
    │
    ├─► Step 2: Extract Unique Locations
    │   └─ ~41K unique weather stations → Coordinates rounded to 3 decimals
    │
    ├─► Step 3: Geocode Locations (WITH CHECKPOINT SUPPORT)
    │   ├─ Worldcities matching (≥100k population, 20-30km radius)
    │   ├─ Worldcities all cities (any population, 40-60km radius)
    │   └─ Nominatim fallback (OpenStreetMap API)
    │
    ├─► Step 4: Filter Weather Data
    │   └─ Keep only weather records from successfully geocoded locations
    │
    └─► Step 5: Process in Batches (DEFAULT: 500 locations per batch)
        ├─ Merge weather data with location data
        ├─ Pivot from long to wide format
        ├─ Clean and convert units
        └─ Save batch (CSV + JSON)
```

### Data Volume at Each Step

```
Step 1: Load Data
   ├─ Input:  35,717,050 raw weather measurements
   └─ Output: 35,717,050 records (7 columns)

Step 2: Extract Unique Locations
   ├─ Input:  35,717,050 records
   └─ Output: ~41,000 unique (lat, long) pairs

Step 3: Geocode Locations
   ├─ Input:  ~41,000 unique locations
   ├─ Worldcities matched: ~30,000 locations (73%)
   ├─ Nominatim fallback: ~8,000 locations (20%)
   ├─ Failed: ~3,000 locations (7%)
   └─ Output: ~38,000 successfully geocoded locations

Step 4: Filter Weather Data
   ├─ Input:  35,717,050 weather records
   ├─ Filter: Keep only records from geocoded locations
   └─ Output: ~33,000,000 weather records (7% data loss)

Step 5: Batch Processing
   ├─ Input:  ~38,000 locations × ~870 records/location = ~33M records
   ├─ Batches: ~38,000 ÷ 500 = 76 batches
   └─ Output: 76 batch files (CSV + JSON format)
```

---

## Module Descriptions

### 1. config.py (Configuration Module)

**Purpose**: Single source of truth for all configuration settings.

**Key Constants**:
```python
# Processing Settings
DEFAULT_BATCH_SIZE_LOCATIONS = 500  # Locations per batch
DEFAULT_GEOCODING_DELAY = 1.5       # Seconds between API calls

# Worldcities Matching Settings
MIN_POPULATION = 100,000            # Major city threshold
SEARCH_RADIUS_KM_PRIMARY = 20.0     # Primary search radius
SEARCH_RADIUS_KM_FALLBACK = 30.0    # Fallback search radius
MATCHING_VERSION = "v2_worldcities"  # Checkpoint version
```

**Key Functions**:
- `ensure_directories()`: Create output directories
- `get_checkpoint_path()`: Path to geocoding checkpoint
- `get_progress_path()`: Path to progress metadata
- `get_failed_geocodes_path()`: Path to failed geocodes

---

### 2. data_loader.py (Data Loading Module)

**Purpose**: Load and prepare raw weather data from various formats.

**Key Functions**:

#### `read_from_pickle_zip(pickle_zip_path: str) -> pd.DataFrame`
- Loads weather data from compressed pickle file (`.pkl.zip`)
- Handles multi-index structure (id, date, data_type)
- Validates data integrity
- Converts date format from MMDD to YYYY-MM-DD

**Input Structure (Pickle)**:
```
Multi-index: (id, date, data_type)
Columns: lat, long, name, value2016, value2017, value2018, value2019, value2020, AVG
Example:
  id          date data_type  lat     long   name              AVG
  AE000041196 0101 TMIN       25.333  55.517 SHARJAH INTER.   147.6
  AE000041196 0101 TAVG       25.333  55.517 SHARJAH INTER.   208.2
```

**Output Structure**:
```
Columns: id, date, data_type, lat, long, name, value
- date: datetime64[ns] (YYYY-MM-DD format)
- value: float32 (temperatures in tenths of °C)
```

#### `read_and_prepare_data(input_csv: str) -> pd.DataFrame`
- Loads weather data from CSV file
- Optimized dtypes for memory efficiency
- Validates coordinates and dates
- Drops invalid records

#### `get_unique_locations(df_weather: pd.DataFrame) -> pd.DataFrame`
- Extracts unique weather station locations
- Rounds coordinates to 3 decimal places (~111m precision)
- Validates coordinate ranges (-90 to 90 lat, -180 to 180 long)
- **Data reduction**: 41,601 stations → ~41,000 unique locations

---

### 3. geocoding.py (Geocoding Module)

**Purpose**: Match weather stations to cities using multi-tiered approach.

**Key Functions**:

#### `load_worldcities(min_population: int) -> Tuple[pd.DataFrame, pd.DataFrame]`
- Loads worldcities.csv reference database
- Returns two DataFrames:
  - Major cities (≥100k population): ~4,000 cities
  - All cities (any population): ~43,000 cities

**Worldcities Structure**:
```
Columns: city, city_ascii, lat, long, country, iso2, iso3, admin_name, 
         capital, population, id
Example:
  Tokyo    Tokyo    35.6897  139.6922  Japan  JP  JPN  Tōkyō  primary  37,977,000
  Rome     Rome     41.8931   12.4828  Italy  IT  ITA  Lazio  primary   4,257,056
```

#### `match_station_to_major_city(...) -> Optional[dict]`
- **Vectorized distance calculation** using NumPy (FAST!)
- Haversine formula for accurate distance
- Cascading radius: 20km primary → 30km fallback
- **ONE CITY PER STATION**: Each city assigned to closest station only
- Prioritization: (1) Population DESC, (2) Distance ASC

**Algorithm Explanation**:
```
For each weather station:
  1. Calculate distance to ALL cities (vectorized with NumPy)
  2. Filter cities within 20km radius
  3. If no cities found, expand to 30km radius
  4. Sort by population (DESC) then distance (ASC)
  5. Find first city NOT already assigned to another station
  6. Mark city as "assigned" to prevent duplicates
  7. If all nearby cities taken, return None (→ Nominatim fallback)
```

**Why "One City Per Station"?**
- **Prevents duplicate data**: Without this, Rome would appear 10+ times from different nearby stations
- **Ensures geographic diversity**: Each station contributes unique location coverage
- **Prioritizes major cities**: The closest station to Rome gets "Rome", others get suburbs or smaller towns

#### `reverse_geocode_locations(...) -> pd.DataFrame`
- **Three-tier matching cascade**:
  1. **Tier 1**: Worldcities major cities (≥100k population, 20-30km)
  2. **Tier 2**: Worldcities all cities (any population, 40-60km)
  3. **Tier 3**: Nominatim API (OpenStreetMap reverse geocoding)

- **Checkpoint/Resume**: Saves progress every 100 locations
- **Data integrity checks**: Validates checkpoint compatibility
- **Rate limiting**: 1.5s delay for Nominatim (API limit)

**Output Structure**:
```
Columns: lat, long, city, country, state, suburb, city_ascii, iso2, iso3, 
         capital, population, worldcities_id, data_source
- data_source: 'worldcities' | 'worldcities_small' | 'nominatim' | 'failed'
```

**Statistics from Actual Run**:
- Worldcities matched: ~30,000 locations (73%)
- Nominatim fallback: ~8,000 locations (20%)
- Failed: ~3,000 locations (7%)

---

### 4. data_processor.py (Data Processing Module)

**Purpose**: Transform and clean weather data.

**Key Functions**:

#### `pivot_and_clean_data(df: pd.DataFrame) -> pd.DataFrame`
- **Pivot operation**: Long format → Wide format
  - Before: Multiple rows per location/date (one per data_type)
  - After: One row per location/date (data_types as columns)

**Transformation**:
```
BEFORE (Long Format):
  city    date        data_type  value
  Rome    2020-01-01  TMIN       147.6
  Rome    2020-01-01  TAVG       208.2
  Rome    2020-01-01  TMAX       268.8

AFTER (Wide Format):
  city    date        TMIN   TAVG   TMAX
  Rome    2020-01-01  14.8   20.8   26.9
```

**Data Cleaning**:
1. **Temperature conversion**: Tenths of °C → °C (divide by 10)
2. **TAVG imputation**: If missing, calculate from (TMAX + TMIN) / 2
3. **Precipitation conversion**: Tenths of mm → mm (divide by 10)
4. **Quality checks**: Flag extreme temps (<-90°C or >60°C)

**DEBUG Logging**:
- Input shape and columns
- Null value analysis
- Sample pivot test (first 1000 rows)
- Output validation

#### `validate_data(df: pd.DataFrame)`
- Checks for required columns
- Validates coordinate ranges
- Identifies null values
- Logs data quality metrics

---

### 5. batch_manager.py (Batch Management Module)

**Purpose**: Manage incremental batch processing and output.

**Key Functions**:

#### `check_batch_exists(batch_num: int) -> bool`
- Checks if batch CSV/JSON already exists
- Enables incremental processing (skip completed batches)

#### `save_batch_output(df, batch_num, location_range, save_json)`
- Saves batch as CSV (always)
- Saves batch as JSON (optional, for API consumption)
- Includes metadata: batch number, location range, record count

#### `list_existing_batches()`
- Lists all processed batches with metadata
- Shows batch number, file size, record count

**Batch Output Format**:
```
Filename: weather_data_batch_001_locations_1-500.csv
Columns: city, country, state, suburb, lat, long, date, name, 
         TMAX, TMIN, TAVG, PRCP, city_ascii, iso2, iso3, capital, 
         population, worldcities_id, data_source
```

---

## Processing Steps (Detailed)

### Step 1: Load and Prepare Data

**Function**: `read_from_pickle_zip()` or `read_and_prepare_data()`

**Input**: 
- Pickle file: `AVERAGED_weather_station_data_ALL.pkl.zip` (~1 GB compressed)
- OR CSV file: `AVERAGED_weather_station_data_ALL.csv`

**Process**:
1. Load data with optimized dtypes
2. Reset multi-index (if pickle)
3. Rename AVG → value
4. Convert date: MMDD → YYYY-MM-DD
5. Validate dates and drop invalid rows

**Output**:
- DataFrame: 35,717,050 rows × 7 columns
- Columns: id, date, data_type, lat, long, name, value

**Data Quality**:
- Null values: Logged and handled
- Invalid dates: Dropped (logged)
- Invalid coordinates: Not yet filtered (done in Step 2)

---

### Step 2: Extract Unique Locations

**Function**: `get_unique_locations()`

**Input**: Weather DataFrame (35M records)

**Process**:
1. Extract [lat, long] columns
2. Filter invalid coordinates:
   - Latitude: -90 to 90
   - Longitude: -180 to 180
3. Drop duplicates
4. Round to 3 decimal places (~111m precision)
5. Drop duplicates again (after rounding)

**Output**:
- DataFrame: ~41,000 rows × 2 columns (lat, long)

**Coordinate Rounding Impact**:
- Before rounding: 41,601 unique locations
- After rounding: ~41,000 unique locations
- **Data consolidation**: Stations within 111m are merged

---

### Step 3: Geocode Locations

**Function**: `reverse_geocode_locations()`

**Input**: Unique locations DataFrame (~41K)

**Process**:

#### 3a. Check for Existing Checkpoint
- Load `geocoding_checkpoint.csv` if exists
- Validate checkpoint version (v2_worldcities)
- Check coordinate overlap with current data
- Resume from where left off

#### 3b. Load Worldcities Database
- Major cities: 4,000 cities (≥100k population)
- All cities: 43,000 cities (any population)

#### 3c. Process in Batches (100 locations per checkpoint)
For each location:

1. **Tier 1: Major Cities** (20-30km radius)
   - Calculate distance to all major cities (vectorized)
   - Filter cities within 20km (or 30km fallback)
   - Sort by population DESC, distance ASC
   - Find first unassigned city
   - **Result**: ~73% of stations matched

2. **Tier 2: All Cities** (40-60km radius)
   - If Tier 1 failed, try ALL worldcities
   - Larger radius (40-60km)
   - Same assignment logic
   - **Result**: ~10% additional matches

3. **Tier 3: Nominatim** (OpenStreetMap API)
   - If Tier 1-2 failed, use Nominatim reverse geocoding
   - Rate limited (1.5s delay)
   - Extract: city, country, state, suburb
   - **Result**: ~20% of stations

4. **Mark as Failed**
   - If all tiers fail, mark data_source = 'failed'
   - **Result**: ~7% of stations

#### 3d. Save Checkpoint Every 100 Locations
- Saves to `geocoding_checkpoint.csv`
- Metadata: progress, stats, ETA
- Enables resume if interrupted

**Output**:
- DataFrame: ~38,000 rows × 13 columns
- Successfully geocoded: ~38,000 (93%)
- Failed: ~3,000 (7%)

**Data Loss Point #1**: 
- Failed geocodes: ~3,000 locations (7%)
- These stations are excluded from final output

---

### Step 4: Filter Weather Data

**Function**: Direct filtering in `main()`

**Input**: 
- Weather data: 35,717,050 records
- Geocoded locations: ~38,000 valid coordinates

**Process**:
1. Round weather data coordinates to 3 decimals
2. Create set of valid (lat, long) tuples
3. Filter weather data: keep only valid coordinates
4. Drop temporary coordinate tuple column

**Output**:
- DataFrame: ~33,000,000 records (93% of original)

**Data Loss Point #2**:
- Filtered out: ~2,700,000 records (7%)
- Reason: No valid geocoded location for these coordinates

---

### Step 5: Process in Batches

**Function**: Main loop in `main()`, calls `pivot_and_clean_data()` and `save_batch_output()`

**Input**: 
- Weather data: ~33M records
- Geocoded locations: ~38,000
- Batch size: 500 locations

**Process**:

#### 5a. Calculate Batches
- Total locations: 38,000
- Batch size: 500
- Number of batches: 76

#### 5b. For Each Batch:
1. **Select Locations**: Get next 500 locations
2. **Filter Weather Data**: 
   - Use inner merge on (lat, long)
   - Keep only weather records for this batch's locations
3. **Merge with Location Data**:
   - Add city, country, state, suburb, etc.
   - Preserves all worldcities metadata
4. **Pivot and Clean** (data_processor.py):
   - Long format → Wide format
   - Convert temperatures: tenths °C → °C
   - Impute missing TAVG: (TMAX + TMIN) / 2
   - Convert precipitation: tenths mm → mm
   - Format date: YYYY-MM-DD string
5. **Validate** (optional):
   - Check for extreme temperatures
   - Log data quality issues
6. **Save Batch**:
   - CSV: Always saved
   - JSON: Optional (--no-json flag)
   - Metadata: batch number, location range

**Output**:
- 76 batch files
- Format: `weather_data_batch_001_locations_1-500.csv`
- Total records: ~33,000,000

**Incremental Processing**:
- Checks if batch exists before processing
- Can force reprocess: `--force-reprocess-batch 5 10 15`

---

## Data Structures

### 1. Raw Weather Data (After Loading)
```python
Columns: id, date, data_type, lat, long, name, value
Dtypes:  str, datetime64, category, float32, float32, str, float32
Shape:   35,717,050 rows × 7 columns

Example:
  id          date        data_type  lat     long    name             value
  AE000041196 2020-01-01  TMIN       25.333  55.517  SHARJAH INTER.   147.6
  AE000041196 2020-01-01  TAVG       25.333  55.517  SHARJAH INTER.   208.2
  AE000041196 2020-01-01  TMAX       25.333  55.517  SHARJAH INTER.   268.8
```

### 2. Unique Locations
```python
Columns: lat, long
Dtypes:  float64, float64
Shape:   ~41,000 rows × 2 columns

Example:
  lat     long
  25.333  55.517
  41.893  12.483
```

### 3. Geocoded Locations
```python
Columns: lat, long, city, country, state, suburb, city_ascii, iso2, iso3, 
         capital, population, worldcities_id, data_source
Dtypes:  float64, float64, str, str, str, str, str, str, str, 
         str, float32, str, str
Shape:   ~38,000 rows × 13 columns

Example:
  lat     long    city   country  state  suburb  city_ascii  iso2  iso3  capital  population  worldcities_id  data_source
  25.333  55.517  Dubai  UAE      Dubai          Dubai       AE    ARE   admin    3,478,000   1784000003      worldcities
  41.893  12.483  Rome   Italy    Lazio          Rome        IT    ITA   primary  4,257,056   1380394269      worldcities
```

### 4. Enriched Weather Data (Before Pivot)
```python
Columns: id, date, data_type, lat, long, name, value, city, country, state, 
         suburb, city_ascii, iso2, iso3, capital, population, worldcities_id, 
         data_source
Shape:   ~33,000,000 rows × 18 columns

Example:
  id          date        data_type  lat     long    name             value   city   country  state  ...
  AE000041196 2020-01-01  TMIN       25.333  55.517  SHARJAH INTER.   147.6   Dubai  UAE      Dubai  ...
  AE000041196 2020-01-01  TAVG       25.333  55.517  SHARJAH INTER.   208.2   Dubai  UAE      Dubai  ...
```

### 5. Final Output (After Pivot)
```python
Columns: city, country, state, suburb, lat, long, date, name, TMAX, TMIN, 
         TAVG, PRCP, city_ascii, iso2, iso3, capital, population, 
         worldcities_id, data_source
Shape:   ~7,000,000 rows × 19 columns (one row per location/date)

Example:
  city   country  state  suburb  lat     long    date        name             TMAX  TMIN  TAVG  PRCP  ...
  Dubai  UAE      Dubai          25.333  55.517  2020-01-01  SHARJAH INTER.   26.9  14.8  20.8  0.0   ...
  Rome   Italy    Lazio          41.893  12.483  2020-01-01  ROMA CIAMPINO    15.2  8.3   11.7  2.3   ...
```

---

## Configuration Parameters

### Geocoding Parameters

```python
MIN_POPULATION = 100,000  # Minimum population for "major cities"
```
- **Impact**: Determines which cities are considered "major" in Tier 1 matching
- **Trade-off**: 
  - Higher value: More exclusive, may miss smaller cities
  - Lower value: More inclusive, but may match to suburbs instead of city centers

```python
SEARCH_RADIUS_KM_PRIMARY = 20.0    # Primary search radius (km)
SEARCH_RADIUS_KM_FALLBACK = 30.0   # Fallback search radius (km)
```
- **Impact**: Maximum distance from station to city for matching
- **Trade-off**:
  - Smaller radius: More accurate city assignment, but more stations unmatched
  - Larger radius: More stations matched, but less accurate (station may be far from city center)

```python
DEFAULT_GEOCODING_DELAY = 1.5  # Seconds between Nominatim API calls
```
- **Impact**: Rate limiting for Nominatim (OpenStreetMap) API
- **Requirement**: Nominatim requires ≥1 second between requests
- **Trade-off**: 
  - Lower value: Faster processing, risk of API ban
  - Higher value: Slower processing, safer

### Batch Processing Parameters

```python
DEFAULT_BATCH_SIZE_LOCATIONS = 500  # Locations per batch file
```
- **Impact**: Number of locations in each output batch
- **Trade-off**:
  - Smaller batches: More files, easier to handle, more granular
  - Larger batches: Fewer files, less overhead, but larger file sizes

### Checkpoint Parameters

```python
MATCHING_VERSION = "v2_worldcities"  # Checkpoint version marker
```
- **Impact**: Ensures checkpoint compatibility
- **Purpose**: If algorithm changes, old checkpoints are invalidated

---

## Checkpoint and Resume Capability

### Geocoding Checkpoints

**Checkpoint Frequency**: Every 100 locations

**Checkpoint Files**:
1. `geocoding_checkpoint.csv`: Full geocoded data so far
2. `geocoding_progress.json`: Metadata (progress %, ETA, stats)

**Resume Logic**:
1. Load checkpoint on startup
2. Validate checkpoint version
3. Check coordinate overlap with current data
4. Merge existing results with new locations
5. Process only ungeocoded locations
6. Save checkpoint incrementally

**Data Protection**:
- Validates merge didn't change row count
- Warns if <50% coordinate overlap
- Checks for required columns

### Batch Processing Checkpoints

**Checkpoint Frequency**: After each batch is saved

**Skip Logic**:
```python
if check_batch_exists(batch_num):
    logger.info(f"Batch {batch_num} already exists, skipping")
    continue
```

**Force Reprocess**:
```bash
--force-reprocess-batch 1 5 10  # Reprocess batches 1, 5, and 10
```

---

## Command-Line Interface

### Basic Usage

```bash
# Run with defaults (uses existing geocoding checkpoint)
python CleanData_MatchCities_ExpandDatesAndWeather.py --skip-geocoding

# Use pickle file
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip' \
  --skip-geocoding
```

### Options

```bash
--input-csv PATH               # Path to input CSV file
--input-pickle-zip PATH        # Path to input pickle zip file
--output-dir PATH              # Output directory for batches
--batch-size-locations N       # Locations per batch (default: 500)
--skip-geocoding               # Use existing geocoding checkpoint
--resume-only                  # Only resume geocoding, exit when complete
--validate                     # Run data validation checks
--no-json                      # Skip JSON output (CSV only)
--force-reprocess-batch N [N...] # Force reprocess specific batches
--list-batches                 # List all existing batches and exit
```

### Example Workflows

```bash
# Full processing from scratch (DO NOT RUN - geocoding disabled in code)
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip'

# Process with existing geocoding (typical usage)
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip' \
  --skip-geocoding

# Custom batch size
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip' \
  --skip-geocoding \
  --batch-size-locations 1000

# List existing batches
python CleanData_MatchCities_ExpandDatesAndWeather.py --list-batches

# Reprocess specific batches
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip' \
  --skip-geocoding \
  --force-reprocess-batch 1 5 10

# Validation mode
python CleanData_MatchCities_ExpandDatesAndWeather.py \
  --input-pickle-zip '/path/to/data.pkl.zip' \
  --skip-geocoding \
  --validate
```

---

## Performance Characteristics

### Processing Time Estimates

```
Step 1: Load Data (pickle)     ~2-5 minutes
Step 2: Extract Locations      ~30 seconds
Step 3: Geocode (if needed)    ~20-30 hours (with Nominatim rate limit)
Step 4: Filter Weather Data    ~2-3 minutes
Step 5: Batch Processing       ~30-60 minutes (76 batches)

Total (with existing geocoding): ~35-70 minutes
Total (from scratch geocoding):  ~21-31 hours
```

### Memory Usage

```
Peak memory: ~8-12 GB
- Loading pickle: ~3-4 GB
- Weather data: ~4-5 GB
- Geocoding: ~2-3 GB
- Batch processing: ~1-2 GB per batch
```

### Disk Usage

```
Input:
  - Pickle file: ~1 GB (compressed)
  - Worldcities.csv: ~10 MB

Output:
  - Geocoding checkpoint: ~5 MB
  - Batch files (CSV): ~3-5 GB total (76 batches)
  - Batch files (JSON): ~4-6 GB total (if enabled)
```

---

## Error Handling

### Geocoding Failures
- **Cause**: Station too far from any city, API errors
- **Handling**: Mark as data_source='failed', log to `failed_geocodes.json`
- **Impact**: ~7% of stations excluded from output

### Invalid Dates
- **Cause**: Malformed date values in input
- **Handling**: Drop rows with invalid dates, log warning
- **Impact**: Minimal (<0.1% of records)

### Extreme Temperature Values
- **Cause**: Data quality issues, sensor errors
- **Handling**: Log warning, but keep values (no filtering)
- **Impact**: Rare (<0.01% of records)

### Merge Integrity Checks
- **Purpose**: Prevent data loss during merge operations
- **Checks**: Row count before/after, coordinate overlap validation
- **Action**: Abort with error if integrity violated

---

## Output Files

### Batch Files

**Location**: `dataAndUtils/worldData/`

**Naming**: `weather_data_batch_{batch_num:03d}_locations_{start}-{end}.csv`

**Format**: CSV (always) + JSON (optional)

**Columns**:
```
city, country, state, suburb, lat, long, date, name, TMAX, TMIN, TAVG, PRCP,
city_ascii, iso2, iso3, capital, population, worldcities_id, data_source
```

### Metadata Files

**processing_summary.json**:
```json
{
  "total_batches": 76,
  "batches_processed": 76,
  "batches_skipped": 0,
  "total_records_processed": 7000000,
  "batch_size_locations": 500,
  "processing_timestamp": "2025-11-22T10:30:00"
}
```

### Geocoding Files

**Location**: `dataAndUtils/vaycay/city_data/`

**Files**:
- `geocoding_checkpoint.csv`: Incremental geocoding progress
- `geocoding_progress.json`: Metadata (progress, stats, ETA)
- `failed_geocodes.json`: List of failed coordinates
- `ALL_location_specific_data_simplified.csv`: Full geocoded data with metadata
- `ALL_location_specific_data.csv`: Simplified geocoded data (core columns only)

---

## Logging

**Log File**: `weather_processing.log`

**Log Level**: INFO

**Key Log Messages**:
- Configuration parameters
- Data loading progress
- Geocoding statistics
- Batch processing status
- Data integrity warnings
- Errors and exceptions

**Example Log Output**:
```
2025-11-22 10:00:00 - INFO - ================================================================================
2025-11-22 10:00:00 - INFO - GLOBAL WEATHER DATA PROCESSING - BATCH MODE
2025-11-22 10:00:00 - INFO - ================================================================================
2025-11-22 10:00:15 - INFO - Loaded 35,717,050 weather records from pickle
2025-11-22 10:00:45 - INFO - Found 41,481 unique weather station locations
2025-11-22 10:00:50 - INFO - After rounding to 3 decimals: 41,000 unique locations
2025-11-22 10:01:00 - INFO - Loaded 38,000 previously geocoded locations
2025-11-22 10:05:30 - INFO - Processing Batch 1/76
2025-11-22 10:06:00 - INFO - Batch 1: Saved 9,500 records
...
2025-11-22 11:30:00 - INFO - SUCCESS! Total time: 90.0 minutes
```

---

## Summary

This pipeline processes 35+ million weather measurements through multiple stages:

1. **Load** raw weather station data
2. **Extract** unique station locations (~41K)
3. **Geocode** stations to cities (multi-tier: Worldcities → Nominatim)
4. **Filter** weather data to valid locations
5. **Process** in batches (pivot, clean, convert units)
6. **Output** 76 batch files with city-based weather data

**Key Features**:
- Multi-tier geocoding (major cities → all cities → Nominatim)
- "One city per station" logic prevents duplicates
- Checkpoint/resume capability at geocoding and batch levels
- Incremental processing (skip completed batches)
- Data integrity validation throughout
- Comprehensive logging and error handling

**Data Loss Points**:
- Failed geocodes: ~7% of stations (~3,000 locations)
- Filtered weather records: ~7% of measurements (~2.7M records)
- Total data retention: ~93%
