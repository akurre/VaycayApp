"""
Configuration module for weather data processing.

This module contains all constants, paths, and configuration settings
used across the weather data processing pipeline.
"""

from pathlib import Path
import logging

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

# ============================================================================
# PATH CONFIGURATION
# ============================================================================

# Constants - Make these configurable
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent  # Go up to repo root
UNCLEANED_DATA_DIR = PROJECT_ROOT / 'uncleaned_data'
OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'vaycay' / 'weather_data'
CITY_DATA_DIR = PROJECT_ROOT / 'dataAndUtils' / 'vaycay' / 'city_data'
BATCH_OUTPUT_DIR = PROJECT_ROOT / 'dataAndUtils' / 'worldData_v2'  # New batch output directory (v2: improved geocoding)
WORLDCITIES_PATH = PROJECT_ROOT / 'dataAndUtils' / 'worldcities.csv'

# ============================================================================
# PROCESSING SETTINGS
# ============================================================================

# Default processing settings
DEFAULT_BATCH_SIZE_LOCATIONS = 500  # Number of locations per output batch
DEFAULT_GEOCODING_DELAY = 1.5  # Seconds between geocoding requests (Nominatim limit)

# Worldcities matching settings
MIN_POPULATION = 100000  # Minimum population for major cities
SEARCH_RADIUS_KM_PRIMARY = 20.0  # Base radius for primary search (expanded per city by population)
SEARCH_RADIUS_KM_FALLBACK = 30.0  # Base radius for fallback search (only if primary finds nothing)
# Note: Cities get effective_radius = base + sqrt(population_millions) * 3
#       London (10.9M): 20 + sqrt(10.9)*3 = ~30km effective reach
#       Smaller cities stay close to base radius
MATCHING_VERSION = "v4_population_radius"  # Version marker for checkpoint compatibility

# ============================================================================
# CHECKPOINT FILE PATHS
# ============================================================================

def get_checkpoint_path() -> Path:
    """Get the path to the geocoding checkpoint file."""
    return CITY_DATA_DIR / 'geocoding_checkpoint.csv'

def get_progress_path() -> Path:
    """Get the path to the geocoding progress metadata file."""
    return CITY_DATA_DIR / 'geocoding_progress.json'

def get_failed_geocodes_path() -> Path:
    """Get the path to the failed geocodes file."""
    return CITY_DATA_DIR / 'failed_geocodes.json'

def get_simplified_data_path() -> Path:
    """Get the path to simplified geocoded data."""
    return CITY_DATA_DIR / 'ALL_location_specific_data_simplified.csv'

def get_full_data_path() -> Path:
    """Get the path to full geocoded data."""
    return CITY_DATA_DIR / 'ALL_location_specific_data.csv'

def get_unmatched_coords_path() -> Path:
    """Get the path to unmatched coordinates file."""
    return CITY_DATA_DIR / 'unmatched_coordinates.csv'

# ============================================================================
# DIRECTORY MANAGEMENT
# ============================================================================

def ensure_directories():
    """Create necessary directories if they don't exist."""
    for directory in [OUTPUT_DIR, CITY_DATA_DIR, BATCH_OUTPUT_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
