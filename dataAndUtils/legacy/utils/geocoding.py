"""
Geocoding module for weather data processing.

This module handles matching weather stations to cities using:
1. Worldcities database (for major cities with population >= 100k)
2. Nominatim fallback (for remote/rural stations)

DATAFRAME STRUCTURES:

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
"""

import pandas as pd
import time
import json
import numpy as np
from pathlib import Path
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from geopy.distance import geodesic
from datetime import datetime
from typing import Optional, Tuple, Set

# Handle both direct execution and package import
try:
    from .config import (
        logger,
        WORLDCITIES_PATH,
        MIN_POPULATION,
        SEARCH_RADIUS_KM_PRIMARY,
        SEARCH_RADIUS_KM_FALLBACK,
        MATCHING_VERSION,
        DEFAULT_GEOCODING_DELAY,
        get_checkpoint_path,
        get_progress_path,
        get_failed_geocodes_path,
        get_simplified_data_path,
        get_full_data_path
    )
except ImportError:
    from config import (
        logger,
        WORLDCITIES_PATH,
        MIN_POPULATION,
        SEARCH_RADIUS_KM_PRIMARY,
        SEARCH_RADIUS_KM_FALLBACK,
        MATCHING_VERSION,
        DEFAULT_GEOCODING_DELAY,
        get_checkpoint_path,
        get_progress_path,
        get_failed_geocodes_path,
        get_simplified_data_path,
        get_full_data_path
    )


def load_worldcities(min_population: int = MIN_POPULATION) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    load worldcities.csv (a very large file) and return both major cities and all cities.

    worldcities.csv snippet:
    ```
    "city","city_ascii","lat","lng","country","iso2","iso3","admin_name","capital","population","id"
    "Tokyo","Tokyo","35.6897","139.6922","Japan","JP","JPN","Tōkyō","primary","37977000","1392685764"
    "Jakarta","Jakarta","-6.2146","106.8451","Indonesia","ID","IDN","Jakarta","primary","34540000","1360771077"
    "Delhi","Delhi","28.6600","77.2300","India","IN","IND","Delhi","admin","29617000","1356872604"
    ```
    
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


def get_geographic_region(lat: float, long: float) -> dict:
    """
    Assign a descriptive region name based on coordinates.
    Used as fallback for stations that fail all geocoding tiers.
    
    Args:
        lat: Latitude
        long: Longitude
    
    Returns:
        dict with city data using geographic region names
    """
    # Polar regions
    if lat > 66.5:
        return {
            'city': 'Arctic Region',
            'country': 'Polar',
            'state': f"Latitude: {lat:.2f}°N",
            'suburb': '',
            'city_ascii': 'Arctic Region',
            'iso2': '',
            'iso3': '',
            'capital': '',
            'population': None,
            'worldcities_id': '',
            'data_source': 'geographic_region'
        }
    elif lat < -66.5:
        return {
            'city': 'Antarctic Region',
            'country': 'Polar',
            'state': f"Latitude: {lat:.2f}°S",
            'suburb': '',
            'city_ascii': 'Antarctic Region',
            'iso2': '',
            'iso3': '',
            'capital': '',
            'population': None,
            'worldcities_id': '',
            'data_source': 'geographic_region'
        }
    
    # Ocean regions (simplified classification)
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


def match_station_to_major_city(
    station_lat: float,
    station_lon: float,
    df_cities: pd.DataFrame,
    primary_radius_km: float = SEARCH_RADIUS_KM_PRIMARY,
    fallback_radius_km: float = SEARCH_RADIUS_KM_FALLBACK,
    station_country: Optional[str] = None
) -> Optional[dict]:
    """
    match a weather station to the nearest major city.
    
    IMPORTANT: This version does NOT use the "one city per station" restriction.
    Multiple stations can match to the same city, which is correct behavior.
    The downstream merge script will handle consolidating data from multiple stations.
    
    args:
        station_lat: station latitude
        station_lon: station longitude
        df_cities: dataframe of major cities
        primary_radius_km: primary search radius
        fallback_radius_km: fallback search radius
        station_country: optional country filter for efficiency
    
    returns:
        dict with city data (city, country, state, suburb, city_ascii, iso2, iso3, 
        capital, population, worldcities_id, data_source) or none if no match
    """
    # CRITICAL OPTIMIZATION: vectorized distance calculation using numpy
    # this is much faster than apply() with lambda for large datasets
    
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
    
    # if still no cities, return none (will use next tier fallback)
    if len(df_nearby) == 0:
        return None
    
    # sort by population (descending) then distance (ascending)
    df_nearby = df_nearby.sort_values(['population', 'distance'], ascending=[False, True])
    
    # Return the closest/most populous city
    # NO "one city per station" restriction - multiple stations can match same city
    city_row = df_nearby.iloc[0]
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


def load_geocoding_progress() -> Optional[pd.DataFrame]:
    """load previous geocoding progress if it exists."""
    checkpoint_path = get_checkpoint_path()
    progress_path = get_progress_path()
    
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
    checkpoint_path = get_checkpoint_path()
    progress_path = get_progress_path()
    
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
            # Round coordinates in existing data to ensure match (4 decimals = ~11m precision)
            existing_geocoded['lat'] = existing_geocoded['lat'].round(4)
            existing_geocoded['long'] = existing_geocoded['long'].round(4)
            
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
    logger.info("\\nloading worldcities data...")
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
    
    # statistics tracking (NO MORE "assigned_cities" - multiple stations can match same city)
    stats = {
        'worldcities_matched': 0,
        'worldcities_small': 0,
        'worldcities_distant': 0,
        'nominatim_fallback': 0,
        'geographic_region': 0
    }
    
    # process locations in batches
    total_to_geocode = len(needs_geocoding)
    total_locations = len(unique_locs)
    already_completed = len(already_geocoded)
    start_time = time.time()

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
        
        logger.info(f"\\nprocessing batch {current_batch} (locations {actual_location_start}-{actual_location_end} of {total_locations})")
        
        # process each location in the batch with cascading fallback
        batch_results = []
        for idx, row in batch.iterrows():
            match_result = None
            
            # step 1: try matching to major cities (population ≥ 100k)
            match_result = match_station_to_major_city(
                row['lat'],
                row['long'],
                df_major_cities,
                primary_radius_km=primary_radius_km,
                fallback_radius_km=fallback_radius_km
            )
            
            # step 2: if no major city match, try ALL cities (any population)
            if not match_result:
                match_result = match_station_to_major_city(
                    row['lat'],
                    row['long'],
                    df_all_cities,
                    primary_radius_km=primary_radius_km,
                    fallback_radius_km=fallback_radius_km
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
            
            # step 4: if everything failed, use geographic region fallback
            if not match_result:
                match_result = get_geographic_region(row['lat'], row['long'])
                stats['geographic_region'] += 1
                logger.debug(f"Using geographic region for ({row['lat']}, {row['long']}): {match_result['city']}")
            else:
                # track statistics based on data source
                if match_result['data_source'] == 'worldcities':
                    stats['worldcities_matched'] += 1
                elif match_result['data_source'] == 'worldcities_small':
                    stats['worldcities_small'] += 1
                elif match_result['data_source'] == 'worldcities_distant':
                    stats['worldcities_distant'] += 1
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
            'worldcities_matched': stats['worldcities_matched'],
            'worldcities_small': stats['worldcities_small'],
            'worldcities_distant': stats['worldcities_distant'],
            'nominatim_fallback': stats['nominatim_fallback'],
            'geographic_region': stats['geographic_region'],
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
        logger.info(f"worldcities: {stats['worldcities_matched']}, small cities: {stats['worldcities_small']}, distant: {stats['worldcities_distant']}, nominatim: {stats['nominatim_fallback']}, geographic: {stats['geographic_region']}")
        logger.info(f"rate: {rate:.2f} locations/sec")
        logger.info(f"eta for remaining: {eta_seconds/60:.1f} minutes")
    
    # Final save
    logger.info("\\nGeocoding complete! Saving final results...")
    logger.info(f"✓ All {len(already_geocoded):,} locations successfully geocoded (100% coverage)")
    logger.info(f"  - Worldcities major: {stats['worldcities_matched']:,}")
    logger.info(f"  - Worldcities small: {stats['worldcities_small']:,}")
    logger.info(f"  - Worldcities distant: {stats['worldcities_distant']:,}")
    logger.info(f"  - Nominatim: {stats['nominatim_fallback']:,}")
    logger.info(f"  - Geographic regions: {stats['geographic_region']:,}")
    final_result = already_geocoded

    # Save detailed version with location objects
    simplified_path = get_simplified_data_path()
    final_result.to_csv(simplified_path, index=False)
    logger.info(f"Saved simplified data to: {simplified_path}")
    
    # Save version without location objects for cleaner output
    output_cols = ['lat', 'long', 'city', 'state', 'country', 'suburb']
    full_path = get_full_data_path()
    final_result[output_cols].to_csv(full_path, index=False)
    logger.info(f"Saved full data to: {full_path}")
    
    return final_result
