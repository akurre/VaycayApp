"""
Weather data processing utilities.

This package contains modules for processing global weather station data
and matching it to cities using worldcities and Nominatim geocoding.

Modules:
    config: Configuration settings, paths, and constants
    data_loader: Functions for loading weather data from CSV/pickle
    geocoding: City matching algorithms using worldcities and Nominatim
    data_processor: Data merging, pivoting, and cleaning functions
    batch_manager: Batch processing and output management

Usage:
    Run the main orchestration script:
    python CleanData_MatchCities_ExpandDatesAndWeather.py --help
"""

__version__ = "2.0.0"
__author__ = "Vaycay Team"

# Make key functions available at package level for convenience
from .config import (
    logger,
    ensure_directories,
    PROJECT_ROOT,
    UNCLEANED_DATA_DIR,
    OUTPUT_DIR,
    CITY_DATA_DIR,
    BATCH_OUTPUT_DIR,
    WORLDCITIES_PATH
)

from .data_loader import (
    read_from_pickle_zip,
    read_and_prepare_data,
    get_unique_locations
)

from .geocoding import (
    load_geocoding_progress,
    reverse_geocode_locations,
    load_worldcities
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

__all__ = [
    # Config
    'logger',
    'ensure_directories',
    'PROJECT_ROOT',
    'UNCLEANED_DATA_DIR',
    'OUTPUT_DIR',
    'CITY_DATA_DIR',
    'BATCH_OUTPUT_DIR',
    'WORLDCITIES_PATH',
    # Data Loader
    'read_from_pickle_zip',
    'read_and_prepare_data',
    'get_unique_locations',
    # Geocoding
    'load_geocoding_progress',
    'reverse_geocode_locations',
    'load_worldcities',
    # Data Processor
    'merge_with_original',
    'pivot_and_clean_data',
    'validate_data',
    # Batch Manager
    'check_batch_exists',
    'list_existing_batches',
    'save_batch_output',
    'save_final_output',
]
