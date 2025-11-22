"""
Batch management module for weather data processing.

This module handles:
1. Checking for existing batches
2. Saving batch outputs
3. Managing batch metadata
4. Listing batch status

INTERMEDIATE FILES:
    - vaycay/city_data/geocoding_checkpoint.csv: Incremental geocoding progress
    - vaycay/city_data/geocoding_progress.json: Progress metadata
    - vaycay/city_data/ALL_location_specific_data.csv: Final geocoded locations
    - vaycay/city_data/failed_geocodes.json: Locations that failed geocoding
    - weather_processing.log: Detailed processing log
"""

import pandas as pd
import json
from pathlib import Path
from datetime import datetime

# Handle both direct execution and package import
try:
    from .config import logger, OUTPUT_DIR, BATCH_OUTPUT_DIR
except ImportError:
    from config import logger, OUTPUT_DIR, BATCH_OUTPUT_DIR


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
    logger.info("\\n=== Existing Batches ===")
    
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
    
    logger.info(f"\\nTotal records across all batches: {total_records:,}")


def save_batch_output(df: pd.DataFrame, batch_num: int, location_range: tuple, save_json: bool = False):
    """Save a batch of processed data to its own directory."""
    batch_dir = BATCH_OUTPUT_DIR / f'batch{batch_num}'
    batch_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"\\nSaving batch {batch_num} (locations {location_range[0]}-{location_range[1]})...")
    
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
    logger.info("\\n=== Summary Statistics ===")
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
