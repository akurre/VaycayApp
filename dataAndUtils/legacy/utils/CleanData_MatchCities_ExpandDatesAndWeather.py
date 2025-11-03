"""
Script to process weather station data and match it to nearest cities.
Pickle file location: '/Users/ashlenlaurakurre/Library/Mobile Documents/com~apple~CloudDocs/Documents/AVERAGED_weather_station_data_ALL.pkl.zip'
To run the script from the console:
```
cd ../legacy && source venv/bin/activate && python utils/CleanData_MatchCities_ExpandDatesAndWeather.py --input-pickle-zip '/Users/ashlenlaurakurre/Library/Mobile Documents/com~apple~CloudDocs/Documents/AVERAGED_weather_station_data_ALL.pkl.zip'
```
optional tags on the end: `--skip-geocoding --no-json`

DATAFRAME STRUCTURES:

1. df_weather (Input - after loading and processing):
   Columns: id, date, data_type, lat, long, name, value
   - id: str - Weather station ID (e.g., 'AE000041196')
   - date: datetime64[ns] - Date in YYYY-MM-DD format (e.g., '2020-01-01')
   - data_type: str - Type of measurement (TMIN, TMAX, TAVG, PRCP)
   - lat: float - Latitude in decimal degrees
   - long: float - Longitude in decimal degrees
   - name: str - Weather station name
   - value: float - Measurement value (temperatures in tenths of degrees C, precipitation in tenths of mm)
   Shape: ~35M rows × 7 columns (long format - one row per station/date/measurement type)

2. unique_locs (Extracted locations):
   Columns: lat, long
   - lat: float - Latitude rounded to 3 decimals
   - long: float - Longitude rounded to 3 decimals
   Shape: ~41K rows × 2 columns (one row per unique weather station location)

3. df_cities (Worldcities reference data):
   Columns: city, city_ascii, lat, long, country, iso2, iso3, admin_name, capital, population, id
   - city: str - City name
   - city_ascii: str - ASCII version of city name
   - lat: float - City latitude
   - long: float - City longitude (renamed from 'lng')
   - country: str - Country name
   - iso2: str - 2-letter country code
   - iso3: str - 3-letter country code
   - admin_name: str - State/province/region name
   - capital: str - Capital status (primary, admin, minor, or empty)
   - population: float - City population
   - id: str - Worldcities unique identifier
   Shape: ~4K rows × 11 columns (filtered to cities with population ≥ 100k)

4. geocoded_data (After location matching):
   Columns: lat, long, city, country, state, suburb, city_ascii, iso2, iso3, capital, 
            population, worldcities_id, data_source
   - lat: float - Station latitude (rounded to 3 decimals)
   - long: float - Station longitude (rounded to 3 decimals)
   - city: str - Matched city name
   - country: str - Country name
   - state: str - State/province/region
   - suburb: str - Suburb/municipality (if applicable)
   - city_ascii: str - ASCII city name (from worldcities)
   - iso2: str - 2-letter country code
   - iso3: str - 3-letter country code
   - capital: str - Capital status
   - population: float - City population (from worldcities)
   - worldcities_id: str - Worldcities ID (if matched via worldcities)
   - data_source: str - Source of geocoding ('worldcities' or 'nominatim')
   Shape: ~41K rows × 13 columns (one row per unique location with city info)

5. df_enriched (After merging weather data with locations):
   Columns: id, date, data_type, lat, long, name, value, city, country, state, suburb,
            city_ascii, iso2, iso3, capital, population, worldcities_id, data_source
   - All columns from df_weather plus all location columns from geocoded_data
   Shape: ~35M rows × 19 columns (same as df_weather but with city information added)

6. df_pivot (Final output - after pivoting and cleaning):
   Columns: city, country, state, suburb, lat, long, date, name, city_ascii, iso2, iso3,
            capital, population, worldcities_id, data_source, TMAX, TMIN, TAVG, PRCP
   - city, country, state, suburb: str - Location information
   - lat, long: float - Coordinates (rounded to 3 decimals)
   - date: str - Date in YYYY-MM-DD format
   - name: str - Weather station name
   - city_ascii, iso2, iso3, capital: str - Additional location metadata
   - population: float - City population
   - worldcities_id: str - Worldcities identifier
   - data_source: str - Geocoding source
   - TMAX, TMIN, TAVG: float - Temperatures in degrees Celsius (converted from tenths)
   - PRCP: float - Precipitation in mm (converted from tenths)
   Shape: ~13M rows × 19 columns (wide format - one row per station/date with all measurements)

INPUT FORMAT:
    CSV file with columns: id, date, data_type, lat, long, name, AVG
    Example:
        id,date,data_type,lat,long,name,AVG
        AE000041196,101,TMIN,25.333,55.517,SHARJAH INTER.,147.6
        AE000041196,101,TAVG,25.333,55.517,SHARJAH INTER.,208.2
    
    Where:
        - id: Weather station ID
        - date: Date as MMDD (e.g., 101 = January 1st)
        - data_type: TMIN, TMAX, TAVG, PRCP, etc.
        - lat/long: Station coordinates (decimal degrees)
        - name: Station name
        - AVG: Average value across years (temperatures in tenths of degrees C)

OUTPUT FORMAT:
    CSV/JSON with columns: city, country, state, suburb, lat, long, date, name, 
                          TMAX, TMIN, TAVG, PRCP (if available)
    Example:
        city,country,state,suburb,lat,long,date,name,TMAX,TMIN,TAVG,PRCP
        Sharjah,United Arab Emirates,Sharjah,,25.333,55.517,2020-01-01,SHARJAH INTER.,29.3,15.5,20.8,0.0
    
    Where:
        - city/country/state/suburb: Geocoded location information
        - lat/long: Rounded to 3 decimal places
        - date: ISO format (YYYY-MM-DD)
        - Temperatures: Converted to degrees Celsius (from tenths)
        - PRCP: Precipitation in mm (from tenths)

INTERMEDIATE FILES:
    - vaycay/city_data/geocoding_checkpoint.csv: Incremental geocoding progress
    - vaycay/city_data/geocoding_progress.json: Progress metadata
    - vaycay/city_data/ALL_location_specific_data.csv: Final geocoded locations
    - vaycay/city_data/failed_geocodes.json: Locations that failed geocoding
    - weather_processing.log: Detailed processing log

This script:
1. Reads historical weather data tied to weather stations
2. Matches stations to major cities using worldcities.csv (population ≥ 100k)
3. Falls back to Nominatim geocoding for stations without nearby major cities
4. Expands dates and processes weather values
5. Saves intermediate results to prevent data loss

CITY MATCHING ALGORITHM:
- Primary: Worldcities matching (population ≥ 100k)
  * Searches within 20km radius (primary) or 30km radius (fallback)
  * Prioritizes by: 1) Population (descending), 2) Distance (ascending)
  * ONE CITY PER STATION: Each major city can only be assigned once
  * Example: If Rome is within range of 3 stations, only the CLOSEST station gets Rome
  * Other stations will get the next-best major city or fall back to Nominatim
- Fallback: Nominatim geocoding for remote/rural stations

WHY ONE CITY PER STATION?
- Prevents duplicate weather data for the same major city
- Ensures each station contributes unique geographic coverage
- Example: ROMA CIAMPINO station gets "Rome", not "Albano Laziale"
- If multiple stations near Rome, they'll get different cities or suburbs

Improvements:
- Worldcities-based matching prioritizes major cities over suburbs
- Removed all country/region filters for global coverage
- Incremental saving with checkpoint/resume capability
- Progress tracking and better error handling
- Configurable paths and batch processing
- Memory-efficient processing for large datasets
- Command-line arguments for flexibility
- Data validation and quality checks
"""

import pandas as pd
import time
import sys
import argparse
from pathlib import Path
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from geopy.distance import geodesic
from datetime import datetime
import json
import logging
import zipfile
import pickle
from typing import Optional, Tuple, Set

# Settings
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('weather_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants - Make these configurable
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent  # Go up to repo root
UNCLEANED_DATA_DIR = PROJECT_ROOT / 'uncleaned_data'
OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'vaycay' / 'weather_data'
CITY_DATA_DIR = PROJECT_ROOT / 'dataAndUtils' / 'vaycay' / 'city_data'
BATCH_OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'worldData'  # New batch output directory
WORLDCITIES_PATH = PROJECT_ROOT / 'dataAndUtils' / 'worldcities.csv'

# Debug: Log the actual paths being used
import sys
logger = logging.getLogger(__name__)

# Default processing settings
DEFAULT_BATCH_SIZE_LOCATIONS = 500  # Number of locations per output batch
DEFAULT_GEOCODING_DELAY = 1.5  # Seconds between geocoding requests (Nominatim limit)

# Worldcities matching settings
MIN_POPULATION = 100000  # Minimum population for major cities
SEARCH_RADIUS_KM_PRIMARY = 20.0  # Primary search radius in kilometers
SEARCH_RADIUS_KM_FALLBACK = 30.0  # Fallback search radius in kilometers
MATCHING_VERSION = "v2_worldcities"  # Version marker for checkpoint compatibility


def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Process global weather station data and match to cities',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run with defaults
  python CleanData_MatchCities_ExpandDatesAndWeather.py
  
  # Resume from checkpoint only (skip if complete)
  python CleanData_MatchCities_ExpandDatesAndWeather.py --resume-only
  
  # Use custom batch size
  python CleanData_MatchCities_ExpandDatesAndWeather.py --batch-size 200
  
  # Skip geocoding (use existing data)
  python CleanData_MatchCities_ExpandDatesAndWeather.py --skip-geocoding
  
  # Validate data quality
  python CleanData_MatchCities_ExpandDatesAndWeather.py --validate
        """
    )
    
    parser.add_argument(
        '--input-csv',
        type=str,
        default=str(UNCLEANED_DATA_DIR / 'AVERAGED_weather_station_data_ALL.csv'),
        help='Path to input weather data CSV'
    )
    
    parser.add_argument(
        '--input-pickle-zip',
        type=str,
        help='Path to input weather data as zipped pickle file (.pkl.zip)'
    )
    
    parser.add_argument(
        '--output-dir',
        type=str,
        default=str(OUTPUT_DIR),
        help='Directory for output files'
    )
    
    parser.add_argument(
        '--geocoding-delay',
        type=float,
        default=DEFAULT_GEOCODING_DELAY,
        help='Delay in seconds between geocoding requests'
    )
    
    parser.add_argument(
        '--skip-geocoding',
        action='store_true',
        help='Skip geocoding step and use existing checkpoint data'
    )
    
    parser.add_argument(
        '--resume-only',
        action='store_true',
        help='Only resume incomplete geocoding, exit if complete'
    )
    
    parser.add_argument(
        '--validate',
        action='store_true',
        help='Run data validation checks'
    )
    
    parser.add_argument(
        '--no-json',
        action='store_true',
        help='Skip JSON output (only save CSV)'
    )
    
    parser.add_argument(
        '--batch-size-locations',
        type=int,
        default=DEFAULT_BATCH_SIZE_LOCATIONS,
        help='Number of locations per output batch (default: 1000)'
    )
    
    parser.add_argument(
        '--force-reprocess-batch',
        type=int,
        nargs='+',
        help='Force reprocessing of specific batch number(s)'
    )
    
    parser.add_argument(
        '--list-batches',
        action='store_true',
        help='List all existing batches and their status, then exit'
    )
    
    return parser.parse_args()


def ensure_directories():
    """Create necessary directories if they don't exist."""
    for directory in [OUTPUT_DIR, CITY_DATA_DIR, BATCH_OUTPUT_DIR]:
        directory.mkdir(parents=True, exist_ok=True)


def read_from_pickle_zip(pickle_zip_path: str) -> pd.DataFrame:
    """
    read weather data from a zipped pickle file.
    
    args:
        pickle_zip_path: path to zipped pickle file (.pkl.zip)
    
    returns:
        dataframe with weather data
    """
    logger.info("reading weather data from zipped pickle file...")
    logger.info(f"reading from: {pickle_zip_path}")
    
    input_path = Path(pickle_zip_path)
    if not input_path.exists():
        raise FileNotFoundError(f"pickle zip file not found: {pickle_zip_path}")
    
    # check file size
    file_size_mb = input_path.stat().st_size / (1024 * 1024)
    logger.info(f"input file size: {file_size_mb:.1f} mb")
    
    # extract pickle to temp location and read with pandas
    logger.info("extracting pickle from zip file...")
    import tempfile
    import shutil
    
    with zipfile.ZipFile(input_path, 'r') as zip_ref:
        # get the pickle file name (should be the only file in the zip)
        pickle_files = [f for f in zip_ref.namelist() if f.endswith('.pkl')]
        if not pickle_files:
            raise ValueError(f"no .pkl file found in {pickle_zip_path}")
        
        pickle_filename = pickle_files[0]
        logger.info(f"found pickle file: {pickle_filename}")
        
        # extract to temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_pickle_path = Path(temp_dir) / pickle_filename
            with zip_ref.open(pickle_filename) as source, open(temp_pickle_path, 'wb') as target:
                shutil.copyfileobj(source, target)
            
            # use pandas read_pickle for better version compatibility
            logger.info("loading pickle data with pandas (handles version compatibility)...")
            df_weather = pd.read_pickle(temp_pickle_path)
    
    logger.info(f"loaded {len(df_weather):,} weather records from pickle")
    
    # log the actual structure
    logger.info(f"pickle file columns: {list(df_weather.columns)}")
    logger.info(f"pickle file index: {df_weather.index.names}")
    logger.info(f"pickle file shape: {df_weather.shape}")
    
    # check if id, date, data_type are in the index (multiindex)
    if df_weather.index.names and any(name in ['id', 'date', 'data_type'] for name in df_weather.index.names):
        logger.info("detected multiindex with id/date/data_type - resetting index to convert to columns")
        df_weather = df_weather.reset_index()
        logger.info(f"after reset_index, columns: {list(df_weather.columns)}")
    
    # validate that we have the expected columns
    required_cols = ['id', 'date', 'data_type', 'lat', 'long', 'name']
    missing_cols = [col for col in required_cols if col not in df_weather.columns]
    if missing_cols:
        logger.error(f"pickle data missing required columns: {missing_cols}")
        logger.error(f"available columns: {list(df_weather.columns)}")
        raise ValueError(f"pickle data missing required columns: {missing_cols}")
    
    # check for value column (might be 'AVG' or 'value')
    if 'AVG' in df_weather.columns:
        df_weather.rename(columns={'AVG': 'value'}, inplace=True)
    elif 'value' not in df_weather.columns:
        raise ValueError("pickle data missing 'AVG' or 'value' column")
    
    # data validation
    null_counts = df_weather.isnull().sum()
    if null_counts.any():
        logger.warning(f"null values found:\n{null_counts[null_counts > 0]}")
    
    # format date column if needed
    if df_weather['date'].dtype != 'datetime64[ns]':
        logger.info("formatting date column...")
        df_weather['date'] = ((df_weather['date'].astype(str).str.zfill(4)) + '2020')
        df_weather['date'] = pd.to_datetime(df_weather['date'], format='%m%d%Y', errors='coerce')
        
        # check for invalid dates
        invalid_dates = df_weather['date'].isnull().sum()
        if invalid_dates > 0:
            logger.warning(f"found {invalid_dates:,} invalid dates, dropping these rows")
            df_weather = df_weather.dropna(subset=['date'])
    
    return df_weather


def read_and_prepare_data(input_csv: str) -> pd.DataFrame:
    """
    Read weather data and reformat date column with validation.
    
    Args:
        input_csv: Path to input CSV file
    
    Returns:
        DataFrame with weather data
    """
    logger.info("Reading weather data and reformatting date column...")
    logger.info(f"Reading from: {input_csv}")
    
    input_path = Path(input_csv)
    if not input_path.exists():
        raise FileNotFoundError(f"Weather data file not found: {input_csv}")
    
    # Check file size
    file_size_mb = input_path.stat().st_size / (1024 * 1024)
    logger.info(f"Input file size: {file_size_mb:.1f} MB")
    
    # Read the data with dtype optimization
    dtype_dict = {
        'id': 'str',
        'date': 'int32',
        'data_type': 'category',
        'lat': 'float32',
        'long': 'float32',
        'name': 'str',
        'AVG': 'float32'
    }
    
    df_weather = pd.read_csv(
        input_csv,
        usecols=['id', 'date', 'data_type', 'lat', 'long', 'name', 'AVG'],
        dtype=dtype_dict
    )
    
    logger.info(f"Loaded {len(df_weather):,} weather records")
    
    # Data validation
    null_counts = df_weather.isnull().sum()
    if null_counts.any():
        logger.warning(f"Null values found:\n{null_counts[null_counts > 0]}")
    
    # Rename and format
    df_weather.rename(columns={'AVG': 'value'}, inplace=True)
    df_weather['date'] = ((df_weather['date'].astype(str).str.zfill(4)) + '2020')
    df_weather['date'] = pd.to_datetime(df_weather['date'], format='%m%d%Y', errors='coerce')
    
    # Check for invalid dates
    invalid_dates = df_weather['date'].isnull().sum()
    if invalid_dates > 0:
        logger.warning(f"Found {invalid_dates:,} invalid dates, dropping these rows")
        df_weather = df_weather.dropna(subset=['date'])
    
    return df_weather


def get_unique_locations(df_weather: pd.DataFrame) -> pd.DataFrame:
    """Extract unique weather station locations with validation."""
    logger.info("Getting unique locations from weather data...")
    
    # Remove invalid coordinates
    valid_coords = (
        (df_weather['lat'].between(-90, 90)) &
        (df_weather['long'].between(-180, 180))
    )
    invalid_count = (~valid_coords).sum()
    if invalid_count > 0:
        logger.warning(f"Removing {invalid_count:,} records with invalid coordinates")
        df_weather = df_weather[valid_coords]
    
    unique_locs = df_weather[['lat', 'long']].drop_duplicates().reset_index(drop=True)
    logger.info(f"Found {len(unique_locs):,} unique weather station locations")
    
    # Round coordinates to reduce near-duplicate locations
    unique_locs['lat'] = unique_locs['lat'].round(3)
    unique_locs['long'] = unique_locs['long'].round(3)
    unique_locs = unique_locs.drop_duplicates().reset_index(drop=True)
    logger.info(f"After rounding to 3 decimals: {len(unique_locs):,} unique locations")
    
    return unique_locs


def load_worldcities(min_population: int = MIN_POPULATION) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    load worldcities.csv and return both major cities and all cities.
    
    args:
        min_population: minimum population threshold for major cities
    
    returns:
        tuple of (major_cities_df, all_cities_df)
    """
    logger.info(f"loading worldcities data from {WORLDCITIES_PATH}...")
    
    if not WORLDCITIES_PATH.exists():
        raise FileNotFoundError(f"worldcities.csv not found at {WORLDCITIES_PATH}")
    
    # read worldcities with optimized dtypes
    dtype_dict = {
        'city': 'str',
        'city_ascii': 'str',
        'lat': 'float32',
        'lng': 'float32',
        'country': 'str',
        'iso2': 'str',
        'iso3': 'str',
        'admin_name': 'str',
        'capital': 'str',
        'population': 'float32',
        'id': 'str'
    }
    
    df_all_cities = pd.read_csv(WORLDCITIES_PATH, dtype=dtype_dict)
    logger.info(f"loaded {len(df_all_cities):,} cities from worldcities.csv")
    
    # rename lng to long for consistency
    df_all_cities.rename(columns={'lng': 'long'}, inplace=True)
    
    # create major cities subset
    df_major_cities = df_all_cities[df_all_cities['population'].notna()].copy()
    df_major_cities = df_major_cities[df_major_cities['population'] >= min_population].copy()
    
    logger.info(f"major cities (≥{min_population:,} population): {len(df_major_cities):,}")
    logger.info(f"all cities (any population): {len(df_all_cities):,}")
    
    return df_major_cities, df_all_cities


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    calculate distance between two coordinates using haversine formula.
    
    args:
        lat1, lon1: first coordinate
        lat2, lon2: second coordinate
    
    returns:
        distance in kilometers
    """
    return geodesic((lat1, lon1), (lat2, lon2)).kilometers


def match_station_to_major_city(
    station_lat: float,
    station_lon: float,
    df_cities: pd.DataFrame,
    assigned_cities: Set[str],
    primary_radius_km: float = SEARCH_RADIUS_KM_PRIMARY,
    fallback_radius_km: float = SEARCH_RADIUS_KM_FALLBACK,
    station_country: Optional[str] = None
) -> Optional[dict]:
    """
    match a weather station to the nearest major city that hasn't been assigned yet.
    
    args:
        station_lat: station latitude
        station_lon: station longitude
        df_cities: dataframe of major cities
        assigned_cities: set of already assigned city names
        primary_radius_km: primary search radius
        fallback_radius_km: fallback search radius
        station_country: optional country filter for efficiency
    
    returns:
        dict with city data (city, country, state, suburb, city_ascii, iso2, iso3, 
        capital, population, worldcities_id, data_source) or none if no match
    """
    # CRITICAL OPTIMIZATION: vectorized distance calculation using numpy
    # this is much faster than apply() with lambda for large datasets
    # the original code called calculate_distance() for EVERY city on EVERY station
    # which means if you have 1000 stations and 5000 cities, that's 5 MILLION function calls!
    
    import numpy as np
    
    # convert to numpy arrays for vectorization
    lat1_rad = np.radians(station_lat)
    lon1_rad = np.radians(station_lon)
    lat2_rad = np.radians(df_cities['lat'].values)
    lon2_rad = np.radians(df_cities['long'].values)
    
    # haversine formula - fully vectorized with numpy
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    df_cities['distance'] = 6371 * c  # radius of earth in km
    
    # filter by country if provided (for efficiency)
    if station_country:
        df_candidates = df_cities[df_cities['country'] == station_country].copy()
        if len(df_candidates) == 0:
            # if no cities in same country, use all cities
            df_candidates = df_cities.copy()
    else:
        df_candidates = df_cities.copy()
    
    # try primary radius first
    df_nearby = df_candidates[df_candidates['distance'] <= primary_radius_km].copy()
    
    # if no cities found, try fallback radius
    if len(df_nearby) == 0:
        df_nearby = df_candidates[df_candidates['distance'] <= fallback_radius_km].copy()
        if len(df_nearby) > 0:
            logger.debug(f"no cities within {primary_radius_km}km, expanded to {fallback_radius_km}km")
    
    # if still no cities, return none (will use nominatim fallback)
    if len(df_nearby) == 0:
        return None
    
    # sort by population (descending) then distance (ascending)
    df_nearby = df_nearby.sort_values(['population', 'distance'], ascending=[False, True])
    
    # find first city that hasn't been assigned
    for _, city_row in df_nearby.iterrows():
        city_key = f"{city_row['city']}_{city_row['country']}"
        if city_key not in assigned_cities:
            assigned_cities.add(city_key)
            return {
                'city': city_row['city'],
                'country': city_row['country'],
                'state': city_row['admin_name'],
                'suburb': '',  # no suburb info in worldcities
                'city_ascii': city_row.get('city_ascii', ''),
                'iso2': city_row.get('iso2', ''),
                'iso3': city_row.get('iso3', ''),
                'capital': city_row.get('capital', ''),
                'population': city_row.get('population', None),
                'worldcities_id': city_row.get('id', ''),
                'data_source': 'worldcities'
            }
    
    # all nearby cities already assigned, return none
    return None


def load_geocoding_progress() -> Optional[pd.DataFrame]:
    """load previous geocoding progress if it exists."""
    checkpoint_path = CITY_DATA_DIR / 'geocoding_checkpoint.csv'
    progress_path = CITY_DATA_DIR / 'geocoding_progress.json'
    
    if checkpoint_path.exists():
        logger.info(f"found existing geocoding checkpoint: {checkpoint_path}")
        df_existing = pd.read_csv(checkpoint_path)
        
        # check version compatibility
        if progress_path.exists():
            with open(progress_path, 'r') as f:
                progress_info = json.load(f)
                checkpoint_version = progress_info.get('matching_version', 'v1_nominatim')
                
                if checkpoint_version != MATCHING_VERSION:
                    logger.warning("=" * 60)
                    logger.warning(f"checkpoint version mismatch!")
                    logger.warning(f"checkpoint version: {checkpoint_version}")
                    logger.warning(f"current version: {MATCHING_VERSION}")
                    logger.warning("starting fresh geocoding with new algorithm")
                    logger.warning("=" * 60)
                    return None
        
        logger.info(f"loaded {len(df_existing):,} previously geocoded locations")
        return df_existing
    return None


def save_geocoding_checkpoint(df: pd.DataFrame, progress_info: dict):
    """Save geocoding progress to allow resumption."""
    checkpoint_path = CITY_DATA_DIR / 'geocoding_checkpoint.csv'
    progress_path = CITY_DATA_DIR / 'geocoding_progress.json'
    
    logger.info(f"Saving checkpoint... ({progress_info['completed']}/{progress_info['total']} locations)")
    df.to_csv(checkpoint_path, index=False)
    
    # Save progress metadata
    with open(progress_path, 'w') as f:
        json.dump(progress_info, f, indent=2)


def reverse_geocode_locations(unique_locs: pd.DataFrame,
                              geocoding_delay: float = DEFAULT_GEOCODING_DELAY,
                              min_population: int = MIN_POPULATION,
                              primary_radius_km: float = SEARCH_RADIUS_KM_PRIMARY,
                              fallback_radius_km: float = SEARCH_RADIUS_KM_FALLBACK) -> pd.DataFrame:
    """
    match weather stations to major cities using worldcities.csv, with nominatim fallback.
    
    args:
        unique_locs: dataframe with lat/long columns
        geocoding_delay: delay between nominatim requests (for fallback)
        min_population: minimum population for major cities
        primary_radius_km: primary search radius
        fallback_radius_km: fallback search radius
    
    returns:
        dataframe with geocoded location information
    """
    logger.info("=" * 80)
    logger.info("starting location matching with worldcities + nominatim fallback")
    logger.info("=" * 80)
    logger.info(f"configuration: min_population={min_population:,}, primary_radius={primary_radius_km}km, fallback_radius={fallback_radius_km}km")
    
    # store original coordinates before any rounding
    unique_locs_original = unique_locs.copy()
    
    # check for existing progress
    existing_geocoded = load_geocoding_progress()
    
    if existing_geocoded is not None:
        # DATA PROTECTION: Validate checkpoint integrity
        logger.info("Validating checkpoint data integrity...")
        
        # Drop the 'location' column if it exists (it's just the raw geocoding response)
        if 'location' in existing_geocoded.columns:
            existing_geocoded = existing_geocoded.drop(columns=['location'])
        
        # Check that checkpoint has required columns
        required_cols = ['lat', 'long', 'city', 'country']
        missing_cols = [col for col in required_cols if col not in existing_geocoded.columns]
        if missing_cols:
            logger.error(f"Checkpoint missing required columns: {missing_cols}")
            logger.error("Checkpoint appears corrupted. Starting fresh geocoding.")
            existing_geocoded = None
        else:
            # Round coordinates in existing data to ensure match
            existing_geocoded['lat'] = existing_geocoded['lat'].round(3)
            existing_geocoded['long'] = existing_geocoded['long'].round(3)
            
            # DATA PROTECTION: Check for coordinate overlap
            checkpoint_coords = set(zip(existing_geocoded['lat'], existing_geocoded['long']))
            current_coords = set(zip(unique_locs['lat'], unique_locs['long']))
            overlap = checkpoint_coords & current_coords
            
            logger.info(f"Checkpoint has {len(checkpoint_coords)} locations")
            logger.info(f"Current data has {len(current_coords)} locations")
            logger.info(f"Overlap: {len(overlap)} locations ({100*len(overlap)/len(current_coords):.1f}%)")
            
            if len(overlap) < len(checkpoint_coords) * 0.5:
                logger.warning("=" * 60)
                logger.warning("WARNING: Less than 50% overlap between checkpoint and current data!")
                logger.warning("This suggests the input data may have changed significantly.")
                logger.warning("Checkpoint will still be used, but verify results carefully.")
                logger.warning("=" * 60)
            
            # Merge existing results
            unique_locs = unique_locs.merge(
                existing_geocoded,
                on=['lat', 'long'],
                how='left',
                suffixes=('', '_existing')
            )
            
            # DATA PROTECTION: Verify merge didn't lose data
            if len(unique_locs) != len(unique_locs_original):
                logger.error(f"CRITICAL: Merge changed row count! Before: {len(unique_locs_original)}, After: {len(unique_locs)}")
                logger.error("This indicates a data integrity issue. Aborting to prevent data loss.")
                raise ValueError("Merge operation changed row count - potential data loss detected")
        
            # Identify locations that still need geocoding
            needs_geocoding = unique_locs[unique_locs['city'].isna()].copy()
            already_geocoded = unique_locs[unique_locs['city'].notna()].copy()
            
            logger.info("=" * 60)
            logger.info("RESUMING FROM CHECKPOINT")
            logger.info("=" * 60)
            logger.info(f"Already geocoded: {len(already_geocoded):,} locations")
            logger.info(f"Still need geocoding: {len(needs_geocoding):,} locations")
            logger.info(f"Progress: {100*len(already_geocoded)/len(unique_locs):.1f}% complete")
            
            # calculate and display which batch we're resuming from (for geocoding checkpoints)
            resuming_batch = len(already_geocoded) // 100 + 1
            logger.info(f"Resuming from batch {resuming_batch}")
            logger.info("=" * 60)
            
            if len(needs_geocoding) == 0:
                logger.info("All locations already geocoded!")
                return unique_locs
    else:
        needs_geocoding = unique_locs.copy()
        already_geocoded = pd.DataFrame()
    
    # load worldcities data - get both major cities and all cities
    logger.info("\nloading worldcities data...")
    df_major_cities, df_all_cities = load_worldcities(min_population=min_population)
    
    # initialize nominatim geocoder for fallback
    geolocator = Nominatim(user_agent="vaycay_weather_geocoder", timeout=10)
    reverse = RateLimiter(geolocator.reverse, min_delay_seconds=geocoding_delay)
    
    def safe_reverse(row):
        """safely reverse geocode a location with error handling and retries."""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                location = reverse((row['lat'], row['long']), language='en')
                return location.raw if location else {}
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.debug(f"retry {attempt + 1}/{max_retries} for ({row['lat']}, {row['long']}): {e}")
                    time.sleep(2)  # wait before retry
                else:
                    logger.warning(f"failed after {max_retries} attempts ({row['lat']}, {row['long']}): {e}")
                    return {}
        return {}
    
    def extract_city(location):
        """extract city name from geocoding result."""
        if location:
            address = location.get('address', {})
            return address.get('city', address.get('town', address.get('village', '')))
        return ''
    
    def extract_state(location):
        """extract state/region from geocoding result."""
        if location:
            address = location.get('address', {})
            return address.get('state', address.get('county', ''))
        return ''
    
    def extract_country(location):
        """extract country from geocoding result."""
        if location:
            address = location.get('address', {})
            return address.get('country', '')
        return ''
    
    def extract_country_code(location):
        """extract country code (iso2) from geocoding result."""
        if location:
            address = location.get('address', {})
            return address.get('country_code', '').upper()
        return ''
    
    def extract_suburb(location):
        """extract suburb/municipality from geocoding result."""
        if location:
            address = location.get('address', {})
            return address.get('suburb', address.get('municipality', ''))
        return ''
    
    # track assigned cities to prevent duplicates
    assigned_cities: Set[str] = set()
    
    # statistics tracking
    stats = {
        'worldcities_matched': 0,
        'nominatim_fallback': 0,
        'failed': 0
    }
    
    # process locations in batches
    total_to_geocode = len(needs_geocoding)
    total_locations = len(unique_locs)
    already_completed = len(already_geocoded)
    start_time = time.time()
    failed_geocodes = []
    
    # use a reasonable batch size for geocoding checkpoints (100 locations)
    geocoding_checkpoint_size = 100
    
    # calculate which batch we're starting from
    starting_batch = already_completed // geocoding_checkpoint_size + 1 if already_completed > 0 else 1
    
    for i in range(0, total_to_geocode, geocoding_checkpoint_size):
        batch_end = min(i + geocoding_checkpoint_size, total_to_geocode)
        batch = needs_geocoding.iloc[i:batch_end].copy()
        
        # calculate actual batch number (accounting for already completed)
        current_batch = starting_batch + (i // geocoding_checkpoint_size)
        actual_location_start = already_completed + i + 1
        actual_location_end = already_completed + batch_end
        
        logger.info(f"\nprocessing batch {current_batch} (locations {actual_location_start}-{actual_location_end} of {total_locations})")
        
        # process each location in the batch with cascading fallback
        batch_results = []
        for idx, row in batch.iterrows():
            match_result = None
            
            # step 1: try matching to major cities (population ≥ 100k)
            match_result = match_station_to_major_city(
                row['lat'],
                row['long'],
                df_major_cities,
                assigned_cities,
                primary_radius_km=primary_radius_km,
                fallback_radius_km=fallback_radius_km
            )
            
            # step 2: if no major city match, try ALL cities (any population)
            if not match_result:
                match_result = match_station_to_major_city(
                    row['lat'],
                    row['long'],
                    df_all_cities,
                    assigned_cities,
                    primary_radius_km=primary_radius_km * 2,  # use larger radius for smaller cities
                    fallback_radius_km=fallback_radius_km * 2
                )
                if match_result:
                    match_result['data_source'] = 'worldcities_small'  # mark as small city match
            
            # step 3: if still no match, try nominatim
            if not match_result:
                location = safe_reverse(row)
                city = extract_city(location)
                
                if city:
                    match_result = {
                        'city': city,
                        'country': extract_country(location),
                        'state': extract_state(location),
                        'suburb': extract_suburb(location),
                        'city_ascii': '',
                        'iso2': extract_country_code(location),
                        'iso3': '',
                        'capital': '',
                        'population': None,
                        'worldcities_id': '',
                        'data_source': 'nominatim'
                    }
            
            # step 4: if everything failed, mark as failed but still include basic info
            if not match_result:
                match_result = {
                    'city': '',
                    'country': '',
                    'state': '',
                    'suburb': '',
                    'city_ascii': '',
                    'iso2': '',
                    'iso3': '',
                    'capital': '',
                    'population': None,
                    'worldcities_id': '',
                    'data_source': 'failed'
                }
                stats['failed'] += 1
                failed_geocodes.append([row['lat'], row['long']])
            else:
                # track statistics based on data source
                if match_result['data_source'] == 'worldcities':
                    stats['worldcities_matched'] += 1
                elif match_result['data_source'] == 'nominatim':
                    stats['nominatim_fallback'] += 1
            
            # add to batch results
            batch_results.append({
                'lat': row['lat'],
                'long': row['long'],
                **match_result
            })
        
        # convert batch results to dataframe
        batch_df = pd.DataFrame(batch_results)
        
        # combine with already processed data
        if len(already_geocoded) > 0:
            combined = pd.concat([already_geocoded, batch_df], ignore_index=True)
        else:
            combined = batch_df
        
        # save checkpoint
        progress_info = {
            'completed': len(combined),
            'total': total_locations,
            'failed_count': len(failed_geocodes),
            'worldcities_matched': stats['worldcities_matched'],
            'nominatim_fallback': stats['nominatim_fallback'],
            'last_updated': datetime.now().isoformat(),
            'current_batch': current_batch,
            'matching_version': MATCHING_VERSION,
            'estimated_time_remaining_minutes': (
                (total_to_geocode - batch_end) * geocoding_delay / 60
            ) if batch_end < total_to_geocode else 0
        }
        save_geocoding_checkpoint(combined, progress_info)
        
        # update already_geocoded for next iteration
        already_geocoded = combined
        
        # progress update
        elapsed = time.time() - start_time
        locations_processed_this_session = batch_end
        rate = locations_processed_this_session / elapsed if elapsed > 0 else 0
        remaining = total_to_geocode - batch_end
        eta_seconds = remaining / rate if rate > 0 else 0
        
        overall_progress = len(combined)
        logger.info(f"overall progress: {overall_progress}/{total_locations} ({100*overall_progress/total_locations:.1f}%)")
        logger.info(f"this session: {locations_processed_this_session}/{total_to_geocode} locations")
        logger.info(f"worldcities: {stats['worldcities_matched']}, nominatim: {stats['nominatim_fallback']}, failed: {stats['failed']}")
        logger.info(f"rate: {rate:.2f} locations/sec")
        logger.info(f"eta for remaining: {eta_seconds/60:.1f} minutes")
    
    # Final save
    logger.info("\nGeocoding complete! Saving final results...")
    final_result = already_geocoded
    
    # Log failed geocodes
    if failed_geocodes:
        logger.warning(f"Failed to geocode {len(failed_geocodes)} locations")
        failed_path = CITY_DATA_DIR / 'failed_geocodes.json'
        with open(failed_path, 'w') as f:
            json.dump(failed_geocodes, f, indent=2)
        logger.info(f"Saved failed geocodes to: {failed_path}")
    
    # Save detailed version with location objects
    simplified_path = CITY_DATA_DIR / 'ALL_location_specific_data_simplified.csv'
    final_result.to_csv(simplified_path, index=False)
    logger.info(f"Saved simplified data to: {simplified_path}")
    
    # Save version without location objects for cleaner output
    output_cols = ['lat', 'long', 'city', 'state', 'country', 'suburb']
    full_path = CITY_DATA_DIR / 'ALL_location_specific_data.csv'
    final_result[output_cols].to_csv(full_path, index=False)
    logger.info(f"Saved full data to: {full_path}")
    
    return final_result


def merge_with_original(df_weather: pd.DataFrame, unique_locs: pd.DataFrame) -> pd.DataFrame:
    """Merge geocoded location data with original weather data."""
    logger.info("Merging location data with weather data...")
    
    # DATA PROTECTION: Store original row count
    original_row_count = len(df_weather)
    logger.info(f"Original weather data: {original_row_count:,} records")
    
    # Round coordinates in weather data to match geocoded data
    df_weather['lat'] = df_weather['lat'].round(3)
    df_weather['long'] = df_weather['long'].round(3)
    
    # Select only needed columns for merge - include all new fields
    location_cols = ['lat', 'long', 'city', 'state', 'country', 'suburb', 
                     'city_ascii', 'iso2', 'iso3', 'capital', 'population', 
                     'worldcities_id', 'data_source']
    # only include columns that exist in unique_locs
    available_cols = [col for col in location_cols if col in unique_locs.columns]
    merge_data = unique_locs[available_cols].copy()
    
    # DATA PROTECTION: Check for duplicates in merge key before merging
    merge_key_dups = merge_data.duplicated(subset=['lat', 'long']).sum()
    if merge_key_dups > 0:
        logger.warning(f"Found {merge_key_dups} duplicate lat/long pairs in geocoded data")
        logger.warning("Keeping first occurrence of each coordinate pair")
        merge_data = merge_data.drop_duplicates(subset=['lat', 'long'], keep='first')
    
    df_enriched = pd.merge(df_weather, merge_data, on=['lat', 'long'], how='left')
    
    # DATA PROTECTION: Verify merge didn't change row count
    if len(df_enriched) != original_row_count:
        logger.error(f"CRITICAL: Merge changed row count!")
        logger.error(f"Before: {original_row_count:,}, After: {len(df_enriched):,}")
        logger.error(f"Difference: {len(df_enriched) - original_row_count:,} rows")
        raise ValueError("Merge operation changed row count - potential data loss or duplication detected")
    
    # Check for unmatched records
    unmatched = df_enriched['city'].isnull().sum()
    if unmatched > 0:
        logger.warning(f"{unmatched:,} records ({100*unmatched/len(df_enriched):.2f}%) could not be matched to geocoded locations")
        
        # Save unmatched coordinates for investigation
        unmatched_coords = df_enriched[df_enriched['city'].isnull()][['lat', 'long']].drop_duplicates()
        unmatched_path = CITY_DATA_DIR / 'unmatched_coordinates.csv'
        unmatched_coords.to_csv(unmatched_path, index=False)
        logger.warning(f"Saved {len(unmatched_coords)} unmatched coordinate pairs to: {unmatched_path}")
    
    logger.info(f"Merged dataset has {len(df_enriched):,} records (verified: no data loss)")
    return df_enriched


def pivot_and_clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Pivot data and clean weather values with validation."""
    logger.info("Pivoting data by location and date...")
    
    # DEBUG: Log input data state
    logger.info(f"DEBUG: Input dataframe shape: {df.shape}")
    logger.info(f"DEBUG: Input columns: {list(df.columns)}")
    logger.info(f"DEBUG: Data types:\n{df.dtypes}")
    logger.info(f"DEBUG: Null counts:\n{df.isnull().sum()}")
    logger.info(f"DEBUG: Unique data_types: {df['data_type'].unique() if 'data_type' in df.columns else 'N/A'}")
    logger.info(f"DEBUG: Sample of first 3 rows:\n{df.head(3)}")
    
    # save population column separately to add back after pivot (to avoid overflow)
    population_map = None
    if 'population' in df.columns:
        # create a mapping of (lat, long) -> population
        population_map = df[['lat', 'long', 'population']].drop_duplicates().set_index(['lat', 'long'])['population']
    
    # build index columns dynamically based on what's available
    # exclude population from pivot to avoid overflow
    base_index = ['city', 'country', 'state', 'suburb', 'lat', 'long', 'date', 'name']
    additional_index = ['city_ascii', 'iso2', 'iso3', 'capital', 
                       'worldcities_id', 'data_source']
    
    # only include columns that exist in the dataframe
    index_cols = [col for col in base_index + additional_index if col in df.columns]
    
    # DEBUG: Check for NaN in index columns before pivot
    logger.info(f"DEBUG: Index columns to use: {index_cols}")
    for col in index_cols:
        nan_count = df[col].isnull().sum()
        if nan_count > 0:
            logger.warning(f"DEBUG: Column '{col}' has {nan_count} NaN values ({100*nan_count/len(df):.1f}%)")
            # Fill NaN with empty string to prevent pivot issues
            logger.info(f"DEBUG: Filling NaN in '{col}' with empty string")
            df[col] = df[col].fillna('')
    
    # DEBUG: Test pivot on small sample first
    logger.info("DEBUG: Testing pivot on first 1000 rows...")
    df_sample = df.head(1000).copy()
    try:
        df_pivot_sample = df_sample.pivot_table(
            index=index_cols,
            columns='data_type',
            values='value',
            aggfunc='first'
        ).reset_index()
        logger.info(f"DEBUG: Sample pivot successful! Produced {len(df_pivot_sample)} records from {len(df_sample)} input records")
    except Exception as e:
        logger.error(f"DEBUG: Sample pivot FAILED with error: {e}")
        import traceback
        traceback.print_exc()
    
    # Perform actual pivot
    logger.info("DEBUG: Performing full pivot...")
    df_pivot = df.pivot_table(
        index=index_cols,
        columns='data_type',
        values='value',
        aggfunc='first'
    ).reset_index()
    
    logger.info(f"DEBUG: Pivot complete! Result shape: {df_pivot.shape}")
    logger.info(f"DEBUG: Pivot result columns: {list(df_pivot.columns)}")
    
    # add population back after pivot
    if population_map is not None:
        df_pivot['population'] = df_pivot.set_index(['lat', 'long']).index.map(population_map).values
    
    logger.info("Processing weather values...")
    
    # Fill missing TAVG with average of TMAX and TMIN
    if 'TAVG' in df_pivot.columns:
        if 'TMAX' in df_pivot.columns and 'TMIN' in df_pivot.columns:
            filled_count = df_pivot['TAVG'].isnull().sum()
            df_pivot['TAVG'] = df_pivot['TAVG'].fillna(
                df_pivot[['TMAX', 'TMIN']].mean(axis=1)
            )
            logger.info(f"Filled {filled_count:,} missing TAVG values using TMAX/TMIN average")
    
    # Convert temperatures from tenths of degrees to degrees
    for col in ['TMAX', 'TMIN', 'TAVG']:
        if col in df_pivot.columns:
            df_pivot[col] = df_pivot[col].div(10).round(2)
    
    # Handle precipitation if present
    if 'PRCP' in df_pivot.columns:
        df_pivot['PRCP'] = df_pivot['PRCP'].div(10).round(2)  # Convert to mm
    
    # Format date
    df_pivot['date'] = df_pivot['date'].dt.strftime('%Y-%m-%d')
    
    # Data quality checks
    for col in ['TMAX', 'TMIN', 'TAVG']:
        if col in df_pivot.columns:
            extreme_temps = (df_pivot[col] < -90) | (df_pivot[col] > 60)
            if extreme_temps.any():
                logger.warning(f"Found {extreme_temps.sum()} extreme {col} values (< -90°C or > 60°C)")
    
    logger.info(f"Final dataset has {len(df_pivot):,} records")
    return df_pivot


def check_batch_exists(batch_num: int) -> bool:
    """Check if a batch has already been processed."""
    batch_dir = BATCH_OUTPUT_DIR / f'batch{batch_num}'
    csv_path = batch_dir / f'batch{batch_num}_weather_data.csv'
    metadata_path = batch_dir / f'batch{batch_num}_metadata.json'
    
    if csv_path.exists() and metadata_path.exists():
        # verify the csv has data
        try:
            df_check = pd.read_csv(csv_path, nrows=1)
            if len(df_check) > 0:
                return True
        except Exception as e:
            logger.warning(f"Batch {batch_num} files exist but appear corrupted: {e}")
            return False
    return False


def list_existing_batches():
    """List all existing batches and their status."""
    logger.info("\n=== Existing Batches ===")
    
    if not BATCH_OUTPUT_DIR.exists():
        logger.info("No batch directory found.")
        return
    
    batch_dirs = sorted([d for d in BATCH_OUTPUT_DIR.iterdir() if d.is_dir() and d.name.startswith('batch')])
    
    if not batch_dirs:
        logger.info("No batches found.")
        return
    
    total_records = 0
    for batch_dir in batch_dirs:
        batch_num = int(batch_dir.name.replace('batch', ''))
        csv_path = batch_dir / f'batch{batch_num}_weather_data.csv'
        metadata_path = batch_dir / f'batch{batch_num}_metadata.json'
        
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                record_count = len(df)
                total_records += record_count
                
                status = "✓ Complete"
                if metadata_path.exists():
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                        date_range = f"{metadata.get('date_range', {}).get('min', 'N/A')} to {metadata.get('date_range', {}).get('max', 'N/A')}"
                else:
                    date_range = "N/A"
                
                logger.info(f"Batch {batch_num}: {status} - {record_count:,} records - {date_range}")
            except Exception as e:
                logger.warning(f"Batch {batch_num}: ✗ Error reading - {e}")
        else:
            logger.info(f"Batch {batch_num}: ✗ Incomplete")
    
    logger.info(f"\nTotal records across all batches: {total_records:,}")


def save_batch_output(df: pd.DataFrame, batch_num: int, location_range: tuple, save_json: bool = False):
    """Save a batch of processed data to its own directory."""
    batch_dir = BATCH_OUTPUT_DIR / f'batch{batch_num}'
    batch_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"\nSaving batch {batch_num} (locations {location_range[0]}-{location_range[1]})...")
    
    # save csv
    csv_path = batch_dir / f'batch{batch_num}_weather_data.csv'
    df.to_csv(csv_path, index=False)
    logger.info(f"  Saved CSV: {csv_path}")
    
    # save json if requested
    if save_json:
        json_path = batch_dir / f'batch{batch_num}_weather_data.json'
        df.to_json(json_path, orient='records', force_ascii=False, indent=2)
        logger.info(f"  Saved JSON: {json_path}")
    
    # save metadata
    metadata = {
        'batch_number': batch_num,
        'location_range': {
            'start': location_range[0],
            'end': location_range[1]
        },
        'total_records': int(len(df)),
        'unique_cities': int(df['city'].nunique()),
        'unique_countries': int(df['country'].nunique()),
        'date_range': {
            'min': df['date'].min(),
            'max': df['date'].max()
        },
        'processing_timestamp': datetime.now().isoformat()
    }
    
    if 'TAVG' in df.columns:
        metadata['temperature_range'] = {
            'min': float(df['TAVG'].min()),
            'max': float(df['TAVG'].max())
        }
    
    metadata_path = batch_dir / f'batch{batch_num}_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"  Saved metadata: {metadata_path}")
    
    logger.info(f"  Batch {batch_num} complete: {len(df):,} records")


def validate_data(df: pd.DataFrame):
    """Run data validation checks."""
    logger.info("\n=== Data Validation ===")
    
    # check for duplicates
    duplicates = df.duplicated(subset=['city', 'country', 'lat', 'long', 'date']).sum()
    if duplicates > 0:
        logger.warning(f"Found {duplicates:,} duplicate records")
    
    # check data completeness
    completeness = (1 - df.isnull().sum() / len(df)) * 100
    logger.info("Data completeness by column:")
    for col, pct in completeness.items():
        logger.info(f"  {col}: {pct:.1f}%")
    
    # check geographic coverage
    logger.info("\nGeographic coverage:")
    logger.info(f"  Unique countries: {df['country'].nunique()}")
    logger.info(f"  Unique cities: {df['city'].nunique()}")
    logger.info(f"  Latitude range: {df['lat'].min():.2f} to {df['lat'].max():.2f}")
    logger.info(f"  Longitude range: {df['long'].min():.2f} to {df['long'].max():.2f}")
    
    # top countries by record count
    logger.info("\nTop 10 countries by record count:")
    top_countries = df['country'].value_counts().head(10)
    for country, count in top_countries.items():
        logger.info(f"  {country}: {count:,}")


def save_final_output(df: pd.DataFrame, output_dir: str, save_json: bool = True):
    """Save final cleaned data to CSV and optionally JSON."""
    logger.info("Saving final output...")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save CSV
    csv_path = output_path / 'global_weather_data_cleaned.csv'
    df.to_csv(csv_path, index=False)
    logger.info(f"Saved CSV to: {csv_path}")
    
    # Save JSON if requested
    if save_json:
        json_path = output_path / 'global_weather_data_cleaned.json'
        df.to_json(json_path, orient='records', force_ascii=False, indent=2)
        logger.info(f"Saved JSON to: {json_path}")
    
    # Print summary statistics
    logger.info("\n=== Summary Statistics ===")
    logger.info(f"Total records: {len(df):,}")
    logger.info(f"Unique cities: {df['city'].nunique():,}")
    logger.info(f"Unique countries: {df['country'].nunique():,}")
    logger.info(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    if 'TAVG' in df.columns:
        logger.info(f"Temperature range: {df['TAVG'].min():.1f}°C to {df['TAVG'].max():.1f}°C")
    
    # Save summary statistics
    summary = {
        'total_records': int(len(df)),
        'unique_cities': int(df['city'].nunique()),
        'unique_countries': int(df['country'].nunique()),
        'date_range': {
            'min': df['date'].min(),
            'max': df['date'].max()
        },
        'processing_timestamp': datetime.now().isoformat()
    }
    
    summary_path = output_path / 'processing_summary.json'
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Saved processing summary to: {summary_path}")


def main():
    """Main execution function."""
    args = parse_arguments()
    
    # handle list-batches command
    if args.list_batches:
        ensure_directories()
        list_existing_batches()
        return
    
    logger.info("=" * 80)
    logger.info("GLOBAL WEATHER DATA PROCESSING - BATCH MODE")
    logger.info("=" * 80)
    logger.info(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("Configuration:")
    logger.info(f"  Input CSV: {args.input_csv}")
    logger.info(f"  Output directory: {args.output_dir}")
    logger.info(f"  Batch output directory: {BATCH_OUTPUT_DIR}")
    logger.info(f"  Output batch size (locations): {args.batch_size_locations}")
    logger.info(f"  Geocoding delay: {args.geocoding_delay}s")
    logger.info(f"  Skip geocoding: {args.skip_geocoding}")
    logger.info(f"  Resume only: {args.resume_only}")
    logger.info(f"  Save JSON: {not args.no_json}")
    if args.force_reprocess_batch:
        logger.info(f"  Force reprocess batches: {args.force_reprocess_batch}")
    logger.info("")
    
    start_time = time.time()
    
    try:
        # ensure output directories exist
        ensure_directories()
        
        # step 1: read and prepare weather data
        if args.input_pickle_zip:
            logger.info(f"  Input pickle zip: {args.input_pickle_zip}")
            df_weather = read_from_pickle_zip(args.input_pickle_zip)
        
        # DEBUG: Check TAVG, TMAX, TMIN data for major cities in pickle
        print("\n" + "=" * 80)
        print("DEBUG: Checking TAVG/TMAX/TMIN data in pickle for major cities")
        print("=" * 80)
        
        # Check for major US cities
        us_cities = ['NEW YORK', 'LOS ANGELES', 'CHICAGO']
        for city_name in us_cities:
            city_data = df_weather[df_weather['name'].str.contains(city_name, case=False, na=False)]
            if len(city_data) > 0:
                print(f"\n{'='*60}")
                print(f"✓ {city_name} found: {len(city_data)} total records")
                print(f"{'='*60}")
                
                # check each data type
                for data_type in ['TAVG', 'TMAX', 'TMIN']:
                    type_data = city_data[city_data['data_type'] == data_type]
                    print(f"\n  {data_type}:")
                    print(f"    Records: {len(type_data)} ({100*len(type_data)/len(city_data):.1f}%)")
                    
                    if len(type_data) > 0:
                        # check value column (renamed from AVG)
                        value_not_null = type_data['value'].notna().sum()
                        print(f"    value (AVG) column not null: {value_not_null} ({100*value_not_null/len(type_data):.1f}%)")
                        
                        # check individual year columns
                        year_cols = ['value2016', 'value2017', 'value2018', 'value2019', 'value2020']
                        for year_col in year_cols:
                            if year_col in type_data.columns:
                                year_not_null = type_data[year_col].notna().sum()
                                print(f"    {year_col} not null: {year_not_null} ({100*year_not_null/len(type_data):.1f}%)")
                        
                        # show sample values
                        if value_not_null > 0:
                            print(f"    Sample value (AVG) values: {type_data[type_data['value'].notna()]['value'].head(3).tolist()}")
                    else:
                        print(f"    ❌ NO {data_type} DATA FOUND")
            else:
                print(f"❌ {city_name} not found in pickle")
        
        # Check for major Australian cities
        aus_cities = ['SYDNEY', 'MELBOURNE']
        for city_name in aus_cities:
            city_data = df_weather[df_weather['name'].str.contains(city_name, case=False, na=False)]
            if len(city_data) > 0:
                print(f"\n{'='*60}")
                print(f"✓ {city_name} found: {len(city_data)} total records")
                print(f"{'='*60}")
                
                # check each data type
                for data_type in ['TAVG', 'TMAX', 'TMIN']:
                    type_data = city_data[city_data['data_type'] == data_type]
                    print(f"\n  {data_type}:")
                    print(f"    Records: {len(type_data)} ({100*len(type_data)/len(city_data):.1f}%)")
                    
                    if len(type_data) > 0:
                        # check value column (renamed from AVG)
                        value_not_null = type_data['value'].notna().sum()
                        print(f"    value (AVG) column not null: {value_not_null} ({100*value_not_null/len(type_data):.1f}%)")
                        
                        # check individual year columns
                        year_cols = ['value2016', 'value2017', 'value2018', 'value2019', 'value2020']
                        for year_col in year_cols:
                            if year_col in type_data.columns:
                                year_not_null = type_data[year_col].notna().sum()
                                print(f"    {year_col} not null: {year_not_null} ({100*year_not_null/len(type_data):.1f}%)")
                        
                        # show sample values
                        if value_not_null > 0:
                            print(f"    Sample value (AVG) values: {type_data[type_data['value'].notna()]['value'].head(3).tolist()}")
                    else:
                        print(f"    ❌ NO {data_type} DATA FOUND")
            else:
                print(f"❌ {city_name} not found in pickle")
        
        print("\n" + "=" * 80)
        print("DEBUG: Exiting after pickle check")
        print("=" * 80)
        exit()
        
        # step 2: get unique locations
        unique_locs = get_unique_locations(df_weather)
        total_locations = len(unique_locs)
        
        # step 3: reverse geocode locations (with checkpoint support)
        if args.skip_geocoding:
            logger.info("Skipping geocoding, loading from checkpoint...")
            geocoded_data = load_geocoding_progress()
            if geocoded_data is None:
                raise ValueError("No geocoding checkpoint found. Run without --skip-geocoding first.")
            
            # filter out failed geocodes
            failed_count = (geocoded_data['data_source'] == 'failed').sum()
            logger.info(f"found {failed_count} failed geocodes in checkpoint")
            geocoded_data = geocoded_data[geocoded_data['data_source'] != 'failed'].reset_index(drop=True)
            logger.info(f"after filtering: {len(geocoded_data)} valid locations remaining")
            total_locations = len(geocoded_data)  # update total
        else:
            # geocoding step - commented out to prevent accidental re-geocoding
            # geocoded_data = reverse_geocode_locations(
            #     unique_locs,
            #     geocoding_delay=args.geocoding_delay
            # )
            
            # force use of checkpoint instead
            logger.info("geocoding disabled - loading from checkpoint instead...")
            geocoded_data = load_geocoding_progress()
            if geocoded_data is None:
                raise ValueError("no geocoding checkpoint found. please use --skip-geocoding flag.")
            
            # filter out failed geocodes
            failed_count = (geocoded_data['data_source'] == 'failed').sum()
            logger.info(f"found {failed_count} failed geocodes in checkpoint")
            geocoded_data = geocoded_data[geocoded_data['data_source'] != 'failed'].reset_index(drop=True)
            logger.info(f"after filtering: {len(geocoded_data)} valid locations remaining")
            total_locations = len(geocoded_data)  # update total
            
            if args.resume_only:
                logger.info("resume-only mode: geocoding complete, exiting.")
                return
        
        # step 4: filter weather data to only include valid geocoded locations
        logger.info("\nFiltering weather data to only include valid geocoded locations...")
        original_weather_count = len(df_weather)
        
        # round coordinates in weather data to match geocoded data
        df_weather['lat'] = df_weather['lat'].round(3)
        df_weather['long'] = df_weather['long'].round(3)
        
        # create set of valid coordinates for fast lookup
        valid_coords = set(zip(geocoded_data['lat'], geocoded_data['long']))
        logger.info(f"Valid geocoded coordinates: {len(valid_coords):,}")
        
        # filter weather data
        df_weather['coord_tuple'] = list(zip(df_weather['lat'], df_weather['long']))
        df_weather = df_weather[df_weather['coord_tuple'].isin(valid_coords)].copy()
        df_weather = df_weather.drop(columns=['coord_tuple'])
        
        filtered_weather_count = len(df_weather)
        logger.info(f"Weather data before filtering: {original_weather_count:,} records")
        logger.info(f"Weather data after filtering: {filtered_weather_count:,} records")
        logger.info(f"Filtered out: {original_weather_count - filtered_weather_count:,} records ({100*(original_weather_count - filtered_weather_count)/original_weather_count:.1f}%)")
        
        # step 5: process data in batches
        logger.info("\n" + "=" * 80)
        logger.info("BATCH PROCESSING")
        logger.info("=" * 80)
        
        batch_size_locs = args.batch_size_locations
        num_batches = (total_locations + batch_size_locs - 1) // batch_size_locs
        logger.info(f"Total locations: {total_locations:,}")
        logger.info(f"Batch size: {batch_size_locs} locations")
        logger.info(f"Number of batches: {num_batches}")
        logger.info("")
        
        batches_processed = 0
        batches_skipped = 0
        total_records_processed = 0
        
        for batch_idx in range(num_batches):
            batch_num = batch_idx + 1
            start_idx = batch_idx * batch_size_locs
            end_idx = min(start_idx + batch_size_locs, total_locations)
            
            # check if we should force reprocess this batch
            force_reprocess = args.force_reprocess_batch and batch_num in args.force_reprocess_batch
            
            # check if batch already exists
            if not force_reprocess and check_batch_exists(batch_num):
                logger.info(f"Batch {batch_num}/{num_batches}: Already exists, skipping (locations {start_idx + 1}-{end_idx})")
                batches_skipped += 1
                continue
            
            logger.info(f"\n{'=' * 60}")
            logger.info(f"Processing Batch {batch_num}/{num_batches}")
            logger.info(f"Locations: {start_idx + 1}-{end_idx} of {total_locations}")
            logger.info(f"{'=' * 60}")
            
            # get locations for this batch
            batch_locations = geocoded_data.iloc[start_idx:end_idx].copy()
            
            # merge with weather data for these locations only
            logger.info(f"Merging weather data for batch {batch_num}...")
            
            # filter weather data to only include locations in this batch
            # use merge instead of inefficient list comprehension
            batch_coords_df = batch_locations[['lat', 'long']].copy()
            df_weather_filtered = df_weather.merge(
                batch_coords_df,
                on=['lat', 'long'],
                how='inner'
            )
            
            logger.info(f"  Weather records for this batch: {len(df_weather_filtered):,}")
            
            if len(df_weather_filtered) == 0:
                logger.warning(f"  No weather data found for batch {batch_num}, skipping")
                continue
            
            # merge with location data - include all available fields
            location_cols = ['lat', 'long', 'city', 'state', 'country', 'suburb', 
                           'city_ascii', 'iso2', 'iso3', 'capital', 'population', 
                           'worldcities_id', 'data_source']
            # only include columns that exist in batch_locations
            available_cols = [col for col in location_cols if col in batch_locations.columns]
            merge_data = batch_locations[available_cols].copy()
            df_batch_enriched = pd.merge(df_weather_filtered, merge_data, on=['lat', 'long'], how='left')
            
            # pivot and clean
            logger.info(f"  Pivoting and cleaning batch {batch_num}...")
            df_batch_cleaned = pivot_and_clean_data(df_batch_enriched)
            
            # validate if requested
            if args.validate:
                validate_data(df_batch_cleaned)
            
            # save batch
            save_batch_output(
                df_batch_cleaned, 
                batch_num, 
                (start_idx + 1, end_idx),
                save_json=not args.no_json
            )
            
            batches_processed += 1
            total_records_processed += len(df_batch_cleaned)
        
        # create summary
        logger.info("\n" + "=" * 80)
        logger.info("BATCH PROCESSING COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Total batches: {num_batches}")
        logger.info(f"Batches processed: {batches_processed}")
        logger.info(f"Batches skipped (already exist): {batches_skipped}")
        logger.info(f"Total records processed: {total_records_processed:,}")
        
        # save overall summary
        summary = {
            'total_batches': num_batches,
            'batches_processed': batches_processed,
            'batches_skipped': batches_skipped,
            'total_records_processed': total_records_processed,
            'batch_size_locations': batch_size_locs,
            'processing_timestamp': datetime.now().isoformat()
        }
        
        summary_path = BATCH_OUTPUT_DIR / 'processing_summary.json'
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        logger.info(f"\nSaved processing summary to: {summary_path}")
        
        # success!
        elapsed = time.time() - start_time
        logger.info(f"\n{'=' * 80}")
        logger.info(f"SUCCESS! Total time: {elapsed/60:.1f} minutes ({elapsed:.0f} seconds)")
        logger.info(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'=' * 80}")
        
    except Exception as e:
        logger.error(f"\n{'=' * 80}")
        logger.error(f"ERROR: {e}")
        logger.error(f"{'=' * 80}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
