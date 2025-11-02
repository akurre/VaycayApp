# Legacy Weather Data Processing Scripts

This directory contains Python scripts for processing historical weather station data and matching it to cities.

## Setup

### 1. Create a Python Virtual Environment

```bash
# From the project root
cd dataAndUtils/legacy

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Scripts

### Main Data Processing Script

The main script is `CleanData_MatchCities_ExpandDatesAndWeather.py` which:
- Reads historical weather data from weather stations
- Matches stations to major cities using worldcities.csv
- Falls back to Nominatim geocoding for remote stations
- Processes and cleans weather values
- Outputs data in batches

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the script from the utils directory
cd utils
python CleanData_MatchCities_ExpandDatesAndWeather.py

# Or run from the legacy directory
python utils/CleanData_MatchCities_ExpandDatesAndWeather.py
```

### Command Line Options

```bash
# Show help
python CleanData_MatchCities_ExpandDatesAndWeather.py --help

# Resume from checkpoint only
python CleanData_MatchCities_ExpandDatesAndWeather.py --resume-only

# Use custom batch size
python CleanData_MatchCities_ExpandDatesAndWeather.py --batch-size 200

# Skip geocoding (use existing data)
python CleanData_MatchCities_ExpandDatesAndWeather.py --skip-geocoding

# List existing batches
python CleanData_MatchCities_ExpandDatesAndWeather.py --list-batches
```

## Input Data

The script expects raw weather station data in a specific format:
- **Required**: Weather station data CSV at: `../../uncleaned_data/AVERAGED_weather_station_data_ALL.csv`
- **Required**: World cities data at: `../../worldcities.csv` (✓ Available)

### Input File Format

The input CSV should have these columns:
- `id`: Weather station ID
- `date`: Date as MMDD (e.g., 101 = January 1st)
- `data_type`: TMIN, TMAX, TAVG, PRCP, etc.
- `lat`, `long`: Station coordinates (decimal degrees)
- `name`: Station name
- `AVG`: Average value across years (temperatures in tenths of degrees C)

### Current Status

⚠️ **Note**: The raw input file (`AVERAGED_weather_station_data_ALL.csv`) is not included in this repository as it's very large. The `weather_data/` directory contains already-processed data files for Italy.

If you need to process new raw weather data:
1. Obtain raw weather station data in the format described above
2. Place it at: `dataAndUtils/uncleaned_data/AVERAGED_weather_station_data_ALL.csv`
3. Run the processing script

Alternatively, you can specify a custom input file:
```bash
python CleanData_MatchCities_ExpandDatesAndWeather.py --input-csv /path/to/your/data.csv
```

## Output

Processed data is saved to:
- `../../vaycay/weather_data/` - Main output directory
- `../../vaycay/city_data/` - Geocoding checkpoints and location data
- `../../worldData/` - Batch output directory

## Dependencies

- **pandas**: Data manipulation and analysis
- **geopy**: Geocoding and distance calculations
- **sqlalchemy**: Database connectivity (for utils.py)
- **psycopg2-binary**: PostgreSQL adapter (for utils.py)

## Notes

- The script uses checkpoint/resume capability to prevent data loss
- Geocoding is rate-limited to respect Nominatim's usage policy
- Processing is done in batches to handle large datasets efficiently
- All coordinates are rounded to 3 decimal places for consistency
