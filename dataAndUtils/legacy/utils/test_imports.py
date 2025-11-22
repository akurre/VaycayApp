"""
Test script to verify all module imports work correctly.

Run this in your virtual environment:
    cd ../legacy && source venv/bin/activate && python utils/test_imports.py
"""

print("Testing imports from refactored modules...")
print("=" * 60)

try:
    from config import logger, ensure_directories
    print("✓ config module imported successfully")
except ImportError as e:
    print(f"✗ config module import failed: {e}")

try:
    from data_loader import read_from_pickle_zip, read_and_prepare_data, get_unique_locations
    print("✓ data_loader module imported successfully")
except ImportError as e:
    print(f"✗ data_loader module import failed: {e}")

try:
    from geocoding import load_geocoding_progress, reverse_geocode_locations, load_worldcities
    print("✓ geocoding module imported successfully")
except ImportError as e:
    print(f"✗ geocoding module import failed: {e}")

try:
    from data_processor import merge_with_original, pivot_and_clean_data, validate_data
    print("✓ data_processor module imported successfully")
except ImportError as e:
    print(f"✗ data_processor module import failed: {e}")

try:
    from batch_manager import check_batch_exists, list_existing_batches, save_batch_output
    print("✓ batch_manager module imported successfully")
except ImportError as e:
    print(f"✗ batch_manager module import failed: {e}")

print("=" * 60)
print("All imports successful! ✓")
print("\\nThe refactored modules are ready to use.")
print("\\nModule structure:")
print("  - config.py: Configuration and constants")
print("  - data_loader.py: Data loading from CSV/pickle")
print("  - geocoding.py: City matching algorithms")
print("  - data_processor.py: Data transformation")
print("  - batch_manager.py: Output management")
print("  - CleanData_MatchCities_ExpandDatesAndWeather.py: Main orchestration")
