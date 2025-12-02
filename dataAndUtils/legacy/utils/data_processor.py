"""
Data processing module for weather data.

This module handles:
1. Merging geocoded location data with weather data
2. Pivoting data from long to wide format
3. Cleaning and validating weather values

DATAFRAME STRUCTURES:

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
"""

import pandas as pd
from pathlib import Path

# Handle both direct execution and package import
try:
    from .config import logger, get_unmatched_coords_path
except ImportError:
    from config import logger, get_unmatched_coords_path


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
        unmatched_path = get_unmatched_coords_path()
        unmatched_coords.to_csv(unmatched_path, index=False)
        logger.warning(f"Saved {len(unmatched_coords)} unmatched coordinate pairs to: {unmatched_path}")
    
    logger.info(f"Merged dataset has {len(df_enriched):,} records (verified: no data loss)")
    return df_enriched


def pivot_and_clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pivot data and clean weather values with validation.
    
    IMPORTANT CHANGE (v4_population_radius_averaged):
    Multiple stations in the same city are now AVERAGED together at the source.
    This provides true city-wide averages rather than keeping separate station data.
    
    Uses MEAN aggregation which:
    - Averages values when multiple stations have the same data type
    - Preserves values when only one station has that data type
    - Example: If only Heathrow has SNWD, that value is kept (not lost)
    
    Example: London with HAMPSTEAD and HEATHROW stations
    - Both have TMAX/TMIN → averaged
    - Only HEATHROW has SNWD → kept as-is
    - Result: Best of both stations combined
    """
    logger.info("Pivoting data by location and date...")
    
    # DEBUG: Log input data state
    logger.info(f"DEBUG: Input dataframe shape: {df.shape}")
    logger.info(f"DEBUG: Input columns: {list(df.columns)}")
    logger.info(f"DEBUG: Sample of first 3 rows:\n{df.head(3)}")
    
    # Count stations per city BEFORE aggregation
    if 'city' in df.columns and 'name' in df.columns and 'date' in df.columns:
        station_counts = df.groupby(['city', 'date'])['name'].nunique()
        cities_with_multiple = station_counts[station_counts > 1]
        if len(cities_with_multiple) > 0:
            # Get unique cities (not city-date pairs)
            cities_list = df[df.groupby(['city', 'date'])['name'].transform('nunique') > 1]['city'].unique()
            logger.info(f"\n✓ Found {len(cities_list)} cities with multiple stations (will be averaged):")
            for city in sorted(cities_list)[:10]:  # Show first 10
                num_stations = df[df['city'] == city]['name'].nunique()
                station_names = df[df['city'] == city]['name'].unique()
                logger.info(f"  - {city}: {num_stations} stations ({', '.join(station_names[:3])})")
            if len(cities_list) > 10:
                logger.info(f"  ... and {len(cities_list) - 10} more")
    
    # Build index columns - EXCLUDE 'name' (station name) and 'lat'/'long' (station coords)
    # This causes multiple stations in the same city to be aggregated together
    base_index = ['city', 'country', 'state', 'suburb', 'date']
    additional_index = ['city_ascii', 'iso2', 'iso3', 'capital',
                       'worldcities_id', 'data_source']

    # only include columns that exist in the dataframe
    index_cols = [col for col in base_index + additional_index if col in df.columns]

    # save population column separately to add back after pivot (to avoid overflow)
    # FIX: Group by geographic identifiers (city, country, state, suburb) to avoid
    # incorrectly assigning same population to cities with same name in different locations
    # (e.g., Houston TX vs Houston MS vs Houston MO)
    population_map = None
    if 'population' in df.columns:
        # Get geographic grouping columns (exclude 'date' and metadata fields)
        geo_group_cols = [col for col in ['city', 'country', 'state', 'suburb']
                         if col in df.columns]

        # Create a mapping of (city, country, state, suburb) -> population
        # This ensures cities with same name but different locations get correct populations
        # For cities without states (e.g., Amsterdam), grouping by (city, country, suburb)
        # will still correctly group all Amsterdam stations together
        population_map = df.groupby(geo_group_cols)['population'].first()
        logger.info(f"✓ Created population map grouped by: {geo_group_cols}")
    
    # Check for NaN in index columns before pivot
    logger.info(f"Index columns (excluding station name/coords for aggregation): {index_cols}")
    for col in index_cols:
        nan_count = df[col].isnull().sum()
        if nan_count > 0:
            logger.warning(f"Column '{col}' has {nan_count} NaN values ({100*nan_count/len(df):.1f}%)")
            # Fill NaN with empty string to prevent pivot issues
            df[col] = df[col].fillna('')
    
    # Perform pivot with MEAN aggregation to average multiple stations
    # IMPORTANT: mean() automatically handles missing values:
    # - If 2 stations both have TMAX: averages them
    # - If only 1 station has SNWD: keeps that value (mean of 1 value = that value)
    # - If 0 stations have a type: NaN (which is correct)
    logger.info("\nPerforming pivot with MEAN aggregation (averaging multiple stations per city)...")
    logger.info("  Note: Mean preserves values from single stations (no data loss)")
    df_pivot = df.pivot_table(
        index=index_cols,
        columns='data_type',
        values='value',
        aggfunc='mean'  # Average when multiple values exist, keep when only one exists
    ).reset_index()
    
    logger.info(f"✓ Pivot complete! Result shape: {df_pivot.shape}")
    logger.info(f"  (Each row = one city/date with averaged data from all stations)")
    logger.info(f"  Available data types: {[col for col in df_pivot.columns if col not in index_cols]}")
    
    # Add representative lat/long back (use mean of all stations' coordinates per city)
    if 'lat' in df.columns and 'long' in df.columns:
        logger.info("Calculating representative coordinates (mean of all stations per city)...")
        # Group by city and get mean coordinates
        coords_mean = df.groupby([col for col in index_cols if col in df.columns])[['lat', 'long']].mean().reset_index()
        df_pivot = df_pivot.merge(coords_mean, on=[col for col in index_cols if col in df.columns], how='left')
        logger.info("✓ Added representative lat/long (averaged across all stations)")
    
    # add population back after pivot
    if population_map is not None and 'city' in df_pivot.columns:
        # Map population using the same geographic columns used to create the map
        geo_group_cols = [col for col in ['city', 'country', 'state', 'suburb']
                         if col in df_pivot.columns]

        # Create a temporary multi-index from the geographic columns
        df_pivot['population'] = df_pivot.set_index(geo_group_cols).index.map(population_map).values
        logger.info(f"✓ Added population data back (mapped by {geo_group_cols})")
    
    logger.info("\nProcessing weather values...")
    
    # Fill missing TAVG with improved formula
    # Research shows TAVG ≈ TMIN + 0.44 * (TMAX - TMIN) is more accurate than simple average
    if 'TAVG' in df_pivot.columns:
        if 'TMAX' in df_pivot.columns and 'TMIN' in df_pivot.columns:
            # Create mask for imputed values
            imputed_mask = df_pivot['TAVG'].isnull()
            filled_count = imputed_mask.sum()

            # Use improved formula: TAVG = TMIN + 0.44 * (TMAX - TMIN)
            # This accounts for the fact that daily temperature doesn't peak exactly at midday
            df_pivot.loc[imputed_mask, 'TAVG'] = (
                df_pivot.loc[imputed_mask, 'TMIN'] +
                0.44 * (df_pivot.loc[imputed_mask, 'TMAX'] - df_pivot.loc[imputed_mask, 'TMIN'])
            )

            if filled_count > 0:
                logger.info(f"✓ Imputed {filled_count:,} missing TAVG values using improved formula")
                logger.info("  Formula: TAVG = TMIN + 0.44 * (TMAX - TMIN)")
    
    # Convert temperatures from tenths of degrees to degrees
    for col in ['TMAX', 'TMIN', 'TAVG']:
        if col in df_pivot.columns:
            df_pivot[col] = df_pivot[col].div(10).round(2)
    
    # Handle precipitation if present
    if 'PRCP' in df_pivot.columns:
        df_pivot['PRCP'] = df_pivot['PRCP'].div(10).round(2)  # Convert to mm
    
    # Handle snow depth if present
    if 'SNWD' in df_pivot.columns:
        df_pivot['SNWD'] = df_pivot['SNWD'].div(10).round(2)  # Convert to cm
    
    # Format date
    df_pivot['date'] = df_pivot['date'].dt.strftime('%Y-%m-%d')
    
    # Data quality checks
    for col in ['TMAX', 'TMIN', 'TAVG']:
        if col in df_pivot.columns:
            extreme_temps = (df_pivot[col] < -90) | (df_pivot[col] > 60)
            if extreme_temps.any():
                logger.warning(f"Found {extreme_temps.sum()} extreme {col} values (< -90°C or > 60°C)")
    
    logger.info(f"\n{'='*60}")
    logger.info(f"✓ Final dataset: {len(df_pivot):,} records (city-date level)")
    logger.info(f"  Multiple stations per city have been averaged")
    logger.info(f"  All available data types preserved (no data loss)")
    logger.info(f"{'='*60}\n")
    
    return df_pivot


def validate_data(df: pd.DataFrame):
    """Run data validation checks."""
    logger.info("\\n=== Data Validation ===")
    
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
    logger.info("\\nGeographic coverage:")
    logger.info(f"  Unique countries: {df['country'].nunique()}")
    logger.info(f"  Unique cities: {df['city'].nunique()}")
    logger.info(f"  Latitude range: {df['lat'].min():.2f} to {df['lat'].max():.2f}")
    logger.info(f"  Longitude range: {df['long'].min():.2f} to {df['long'].max():.2f}")
    
    # top countries by record count
    logger.info("\\nTop 10 countries by record count:")
    top_countries = df['country'].value_counts().head(10)
    for country, count in top_countries.items():
        logger.info(f"  {country}: {count:,}")
