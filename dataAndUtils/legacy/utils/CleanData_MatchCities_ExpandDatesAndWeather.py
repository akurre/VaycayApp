"""
Script to process weather station data and match it to nearest cities.

This is the main orchestration file that ties together all the processing modules.

Pickle file location: '/Users/ashlenlaurakurre/Library/Mobile Documents/com~apple~CloudDocs/Documents/AVERAGED_weather_station_data_ALL.pkl.zip'
To run the script from the console:
```
cd dataAndUtils/legacy && source venv/bin/activate && python utils/CleanData_MatchCities_ExpandDatesAndWeather.py --input-pickle-zip '/Users/ashlenlaurakurre/Library/Mobile Documents/com~apple~CloudDocs/Documents/AVERAGED_weather_station_data_ALL.pkl.zip'
```

optional tags on the end: `--skip-geocoding --no-json`

DATAFRAME STRUCTURES:

See individual module files for detailed dataframe structure documentation:
- data_loader.py: Input weather data structure
- geocoding.py: Worldcities and geocoded data structures
- data_processor.py: Merged and pivoted data structures

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
from datetime import datetime
import json

# Import from our new modules - handle both direct execution and package import
try:
    # Try relative imports first (when used as a package)
    from .config import (
        logger,
        ensure_directories,
        UNCLEANED_DATA_DIR,
        OUTPUT_DIR,
        BATCH_OUTPUT_DIR,
        DEFAULT_BATCH_SIZE_LOCATIONS,
        DEFAULT_GEOCODING_DELAY
    )
    from .data_loader import (
        read_from_pickle_zip,
        read_and_prepare_data,
        get_unique_locations
    )
    from .geocoding import (
        load_geocoding_progress,
        reverse_geocode_locations
    )
    from .data_processor import (
        merge_with_original,
        pivot_and_clean_data,
        validate_data
    )
    from .batch_manager import (
        check_batch_exists,
        list_existing_batches,
        save_batch_output,
        save_final_output
    )
except ImportError:
    # Fall back to absolute imports (when run directly as a script)
    from config import (
        logger,
        ensure_directories,
        UNCLEANED_DATA_DIR,
        OUTPUT_DIR,
        BATCH_OUTPUT_DIR,
        DEFAULT_BATCH_SIZE_LOCATIONS,
        DEFAULT_GEOCODING_DELAY
    )
    from data_loader import (
        read_from_pickle_zip,
        read_and_prepare_data,
        get_unique_locations
    )
    from geocoding import (
        load_geocoding_progress,
        reverse_geocode_locations
    )
    from data_processor import (
        merge_with_original,
        pivot_and_clean_data,
        validate_data
    )
    from batch_manager import (
        check_batch_exists,
        list_existing_batches,
        save_batch_output,
        save_final_output
    )

# Settings
pd.set_option('display.max_columns', None)
pd.set_option('display.width', 1000)


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
        else:
            df_weather = read_and_prepare_data(args.input_csv)
        
        # step 2: get unique locations
        unique_locs = get_unique_locations(df_weather)
        total_locations = len(unique_locs)
        
        # step 3: reverse geocode locations (with checkpoint support)
        if args.skip_geocoding:
            logger.info("Skipping geocoding, loading from checkpoint...")
            geocoded_data = load_geocoding_progress()
            if geocoded_data is None:
                raise ValueError("No geocoding checkpoint found. Run without --skip-geocoding first.")

            # No filtering needed - all locations are now successfully geocoded
            logger.info(f"Loaded {len(geocoded_data):,} geocoded locations (100% coverage)")

            # SORTING FIX: Sort by city to keep same-city stations together in batches
            logger.info("Sorting locations by city to keep same-city stations together...")
            geocoded_data = geocoded_data.sort_values(
                ['city', 'country', 'state', 'lat', 'long']
            ).reset_index(drop=True)
            logger.info("✓ Locations sorted - same-city stations will be in same batch")

            total_locations = len(geocoded_data)
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

            # No filtering needed - all locations are now successfully geocoded
            logger.info(f"Loaded {len(geocoded_data):,} geocoded locations (100% coverage)")

            # SORTING FIX: Sort by city to keep same-city stations together in batches
            logger.info("Sorting locations by city to keep same-city stations together...")
            geocoded_data = geocoded_data.sort_values(
                ['city', 'country', 'state', 'lat', 'long']
            ).reset_index(drop=True)
            logger.info("✓ Locations sorted - same-city stations will be in same batch")

            total_locations = len(geocoded_data)

            if args.resume_only:
                logger.info("resume-only mode: geocoding complete, exiting.")
                return
        
        # step 4: filter weather data to only include valid geocoded locations
        logger.info("\\nFiltering weather data to only include valid geocoded locations...")
        original_weather_count = len(df_weather)
        
        # round coordinates in weather data to match geocoded data (4 decimals = ~11m precision)
        df_weather['lat'] = df_weather['lat'].round(4)
        df_weather['long'] = df_weather['long'].round(4)
        
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
        logger.info("\\n" + "=" * 80)
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
            
            logger.info(f"\\n{'=' * 60}")
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
        logger.info("\\n" + "=" * 80)
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
        logger.info(f"\\nSaved processing summary to: {summary_path}")
        
        # success!
        elapsed = time.time() - start_time
        logger.info(f"\\n{'=' * 80}")
        logger.info(f"SUCCESS! Total time: {elapsed/60:.1f} minutes ({elapsed:.0f} seconds)")
        logger.info(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'=' * 80}")
        
    except Exception as e:
        logger.error(f"\\n{'=' * 80}")
        logger.error(f"ERROR: {e}")
        logger.error(f"{'=' * 80}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
