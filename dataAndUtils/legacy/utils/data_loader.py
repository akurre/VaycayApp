"""
Data loading module for weather data processing.

This module handles reading weather data from various formats (CSV, pickle)
and preparing it for further processing.

DATAFRAME STRUCTURES:

0. The imported pickle file at '/Users/ashlenlaurakurre/Library/Mobile Documents/com~apple~CloudDocs/Documents/AVERAGED_weather_station_data_ALL.pkl.zip'
has a 3 part index: id, date, and data_type. Together they form one "key". The other columns are lat, long, name, value2016, value2017, value2020,
value2019, value2018, and AVG which is the average of all the "years" like value2019. 

<bound method NDFrame.head of                                lat    long            name  value2016  value2017  value2020  value2019  value2018    AVG
id          date data_type                                                                                              
AE000041196 0101 TMIN       25.333  55.517  SHARJAH INTER.      155.0      163.0      168.0      140.0      112.0  147.6
                 TAVG       25.333  55.517  SHARJAH INTER.      229.0      217.0      211.0      198.0      186.0  208.2
            0102 TMAX       25.333  55.517  SHARJAH INTER.      293.0      264.0        NaN      265.0        NaN  274.0
                 TMIN       25.333  55.517  SHARJAH INTER.      188.0        NaN        NaN      137.0        NaN  162.5
                 TAVG       25.333  55.517  SHARJAH INTER.      243.0      222.0      214.0      196.0      191.0  213.2
...                            ...     ...             ...        ...        ...        ...        ...        ...    ...
ZI000067983 1230 PRCP      -20.200  32.616        CHIPINGE       30.0        NaN        NaN        NaN        NaN   30.0
                 TAVG      -20.200  32.616        CHIPINGE      228.0        NaN        NaN        NaN        NaN  228.0
            1231 TMAX      -20.200  32.616        CHIPINGE      258.0        NaN        NaN        NaN        NaN  258.0
                 PRCP      -20.200  32.616        CHIPINGE        0.0        NaN        NaN        NaN        NaN    0.0
                 TAVG      -20.200  32.616        CHIPINGE      234.0        NaN        NaN        NaN        NaN  234.0

[35717050 rows x 9 columns]>

Statistics about this pickle file:
    WEATHER DATAFRAME DIAGNOSTIC STATISTICS:
        - Total rows: 35,717,050
        - Total unique weather stations (IDs): 41,601
        - Total unique dates: 366
        - Total unique data types: 68
        - Data types present: ['AWDR', 'AWND', 'DAPR', 'DASF', 'DATN', 'DATX', 'DWPR', 'EVAP', 'MDPR', 'MDSF', 'MDTN', 'MDTX', 'MNPN', 'MXPN', 'PGTM', 'PRCP', 'PSUN', 'SN31', 'SN32', 'SN33', 'SN35', 'SN36', 'SN51', 'SN52', 'SN53', 'SN55', 'SN56', 'SNOW', 'SNWD', 'SX31', 'SX32', 'SX33', 'SX35', 'SX36', 'SX51', 'SX52', 'SX53', 'SX55', 'SX56', 'TAVG', 'THIC', 'TMAX', 'TMIN', 'TOBS', 'TSUN', 'WDF2', 'WDF5', 'WDFG', 'WDMV', 'WESD', 'WESF', 'WSF2', 'WSF5', 'WSFG', 'WSFI', 'WT01', 'WT02', 'WT03', 'WT04', 'WT05', 'WT06', 'WT07', 'WT08', 'WT09', 'WT10', 'WT11', 'WT17', 'WT18']
    STATION-LEVEL ANALYSIS:
        - Stations with ONLY PRCP data: 5,593 (13.4%)
        - Data type combinations across stations:
            - PRCP: 5,593 stations (13.4%)
            - PRCP, SNOW: 4,477 stations (10.8%)
            - DAPR, MDPR, PRCP, SNOW: 4,011 stations (9.6%)
            - DAPR, MDPR, PRCP, SNOW, SNWD, WESD, WESF: 2,408 stations (5.8%)
            - PRCP, TAVG, TMAX, TMIN: 1,763 stations (4.2%)
            - PRCP, SNOW, SNWD, WESD, WESF: 1,697 stations (4.1%)
            - PRCP, SNOW, SNWD: 1,497 stations (3.6%)
            - PRCP, SNWD, TAVG, TMAX, TMIN: 1,386 stations (3.3%)
            - TAVG, TMAX, TMIN: 1,378 stations (3.3%)
            - DAPR, MDPR, PRCP, SNOW, SNWD: 1,303 stations (3.1%)
    YEAR AVAILABILITY ANALYSIS:
        - Distribution of available years per measurement:
            - 1 year(s) of data: 2,395,181 measurements (6.7%)
            - 2 year(s) of data: 2,344,252 measurements (6.6%)
            - 3 year(s) of data: 2,765,016 measurements (7.7%)
            - 4 year(s) of data: 4,576,484 measurements (12.8%)
            - 5 year(s) of data: 23,636,117 measurements (66.2%)
        - Stations where ALL measurements have only 1 year of data: 31,436 (75.6%)
        - Data availability by year:
            - value2016: 35,717,050 measurements (100.0%)
            - value2017: 30,850,266 measurements (86.4%)
            - value2018: 29,534,959 measurements (82.7%)
            - value2019: 28,282,707 measurements (79.2%)
            - value2020: 27,480,272 measurements (76.9%)
    GEOGRAPHIC DISTRIBUTION:
        - Total unique geographic locations: 41,481
        - Latitude range: -90.000 to 83.650
        - Longitude range: -179.983 to 179.217
    MAJOR CITY SPOT CHECK:
        - London, UK area (~51.5°N, -0.1°W): NO STATIONS FOUND
        - Paris, France area (~48.9°N, 2.3°E): ['FRM00007149', 'FRM00007150', 'FRM00007156']
        - New York, USA area (~40.7°N, -74.0°W): ['US1NJBG0015', 'US1NJBG0018', 'US1NJES0020', ...]
    DATA QUALITY METRICS:
        - Null values in AVG column: 0 (0.0%)
    STATION NAME ANALYSIS:
        Total unique station names: 25,372



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
"""

import pandas as pd
import zipfile
import pickle
import tempfile
import shutil
from pathlib import Path
from typing import Union

# Handle both direct execution and package import
try:
    from .config import logger, UNCLEANED_DATA_DIR
except ImportError:
    from config import logger, UNCLEANED_DATA_DIR


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

    print(df_weather.head)
    
    # ============================================================================
    # DIAGNOSTIC STATISTICS FOR WEATHER DATAFRAME
    # ============================================================================
    logger.info("\n" + "=" * 80)
    logger.info("WEATHER DATAFRAME DIAGNOSTIC STATISTICS")
    logger.info("=" * 80)
    
    # Basic statistics
    logger.info(f"\nTotal rows: {len(df_weather):,}")
    logger.info(f"Total unique weather stations (IDs): {df_weather.index.get_level_values('id').nunique():,}")
    logger.info(f"Total unique dates: {df_weather.index.get_level_values('date').nunique():,}")
    logger.info(f"Total unique data types: {df_weather.index.get_level_values('data_type').nunique()}")
    logger.info(f"Data types present: {sorted(df_weather.index.get_level_values('data_type').unique().tolist())}")
    
    # Station-level analysis
    logger.info("\n" + "-" * 80)
    logger.info("STATION-LEVEL ANALYSIS")
    logger.info("-" * 80)
    
    # Group by station ID to analyze per-station metrics
    station_groups = df_weather.groupby(level='id')
    
    # Data type availability per station
    station_data_types = df_weather.reset_index().groupby('id')['data_type'].apply(lambda x: set(x.unique()))
    
    # Count stations with only PRCP data
    only_prcp_stations = sum(1 for dtypes in station_data_types if dtypes == {'PRCP'})
    logger.info(f"\nStations with ONLY PRCP data: {only_prcp_stations:,} ({100*only_prcp_stations/len(station_data_types):.1f}%)")
    
    # Count stations by data type combinations
    logger.info("\nData type combinations across stations:")
    dtype_combos = station_data_types.value_counts().head(10)
    for combo, count in dtype_combos.items():
        combo_str = ", ".join(sorted(combo))
        logger.info(f"  {combo_str}: {count:,} stations ({100*count/len(station_data_types):.1f}%)")
    
    # Year availability analysis
    logger.info("\n" + "-" * 80)
    logger.info("YEAR AVAILABILITY ANALYSIS")
    logger.info("-" * 80)
    
    # Count how many year columns have non-null values per row
    year_cols = ['value2016', 'value2017', 'value2018', 'value2019', 'value2020']
    available_years = df_weather[year_cols].notna().sum(axis=1)
    
    logger.info("\nDistribution of available years per measurement:")
    for n_years in sorted(available_years.unique()):
        count = (available_years == n_years).sum()
        pct = 100 * count / len(df_weather)
        logger.info(f"  {n_years} year(s) of data: {count:,} measurements ({pct:.1f}%)")
    
    # Stations with only 1 year of data across ALL their measurements
    station_min_years = df_weather.groupby(level='id').apply(
        lambda x: x[year_cols].notna().sum(axis=1).min()
    )
    only_one_year_stations = (station_min_years == 1).sum()
    logger.info(f"\nStations where ALL measurements have only 1 year of data: {only_one_year_stations:,} ({100*only_one_year_stations/len(station_min_years):.1f}%)")
    
    # Data availability by year
    logger.info("\nData availability by year:")
    for year_col in year_cols:
        non_null = df_weather[year_col].notna().sum()
        pct = 100 * non_null / len(df_weather)
        logger.info(f"  {year_col}: {non_null:,} measurements ({pct:.1f}%)")
    
    # Geographic distribution
    logger.info("\n" + "-" * 80)
    logger.info("GEOGRAPHIC DISTRIBUTION")
    logger.info("-" * 80)
    
    unique_locs_df = df_weather[['lat', 'long']].drop_duplicates()
    logger.info(f"\nTotal unique geographic locations: {len(unique_locs_df):,}")
    logger.info(f"Latitude range: {df_weather['lat'].min():.3f} to {df_weather['lat'].max():.3f}")
    logger.info(f"Longitude range: {df_weather['long'].min():.3f} to {df_weather['long'].max():.3f}")
    
    # Check for major cities - sample some known locations
    logger.info("\n" + "-" * 80)
    logger.info("MAJOR CITY SPOT CHECK")
    logger.info("-" * 80)
    
    # London, UK is approximately 51.5°N, -0.1°W
    london_stations = df_weather[
        (df_weather['lat'].between(51.3, 51.7)) & 
        (df_weather['long'].between(-0.3, 0.1))
    ]
    if len(london_stations) > 0:
        london_station_ids = london_stations.index.get_level_values('id').unique()
        logger.info(f"\nLondon, UK area (~51.5°N, -0.1°W):")
        logger.info(f"  Found {len(london_station_ids)} station(s): {list(london_station_ids)[:5]}")
        logger.info(f"  Total measurements: {len(london_stations):,}")
        # Show station names
        for station_id in london_station_ids[:3]:
            station_data = london_stations.xs(station_id, level='id')
            station_name = station_data['name'].iloc[0]
            logger.info(f"    - {station_id}: {station_name}")
    else:
        logger.info("\nLondon, UK area (~51.5°N, -0.1°W): NO STATIONS FOUND")
    
    # Paris, France is approximately 48.9°N, 2.3°E
    paris_stations = df_weather[
        (df_weather['lat'].between(48.7, 49.1)) & 
        (df_weather['long'].between(2.1, 2.5))
    ]
    if len(paris_stations) > 0:
        paris_station_ids = paris_stations.index.get_level_values('id').unique()
        logger.info(f"\nParis, France area (~48.9°N, 2.3°E):")
        logger.info(f"  Found {len(paris_station_ids)} station(s): {list(paris_station_ids)[:5]}")
    else:
        logger.info("\nParis, France area (~48.9°N, 2.3°E): NO STATIONS FOUND")
    
    # New York is approximately 40.7°N, -74.0°W
    ny_stations = df_weather[
        (df_weather['lat'].between(40.5, 40.9)) & 
        (df_weather['long'].between(-74.2, -73.8))
    ]
    if len(ny_stations) > 0:
        ny_station_ids = ny_stations.index.get_level_values('id').unique()
        logger.info(f"\nNew York, USA area (~40.7°N, -74.0°W):")
        logger.info(f"  Found {len(ny_station_ids)} station(s): {list(ny_station_ids)[:5]}")
    else:
        logger.info("\nNew York, USA area (~40.7°N, -74.0°W): NO STATIONS FOUND")
    
    # Data quality metrics
    logger.info("\n" + "-" * 80)
    logger.info("DATA QUALITY METRICS")
    logger.info("-" * 80)
    
    # Check for null values in AVG column
    null_avg = df_weather['AVG'].isna().sum()
    logger.info(f"\nNull values in AVG column: {null_avg:,} ({100*null_avg/len(df_weather):.1f}%)")
    
    # Analyze by data type - more useful than overall AVG stats
    logger.info("\nValue ranges by data type (showing key types only):")
    key_data_types = ['TMIN', 'TMAX', 'TAVG', 'PRCP', 'SNOW', 'SNWD']
    for dtype in key_data_types:
        dtype_data = df_weather.xs(dtype, level='data_type', drop_level=False)
        if len(dtype_data) > 0:
            logger.info(f"  {dtype}:")
            logger.info(f"    Count: {len(dtype_data):,} measurements")
            logger.info(f"    Min: {dtype_data['AVG'].min():.1f}, Max: {dtype_data['AVG'].max():.1f}, Median: {dtype_data['AVG'].median():.1f}")
    
    # Additional useful analysis
    logger.info("\n" + "-" * 80)
    logger.info("STATION COMPLETENESS ANALYSIS")
    logger.info("-" * 80)
    
    # Stations with complete temperature data (TMIN, TMAX, TAVG)
    station_data_types = df_weather.reset_index().groupby('id')['data_type'].apply(lambda x: set(x.unique()))
    stations_with_temps = sum(1 for dtypes in station_data_types if {'TMIN', 'TMAX', 'TAVG'}.issubset(dtypes))
    logger.info(f"\nStations with complete temperature data (TMIN, TMAX, TAVG): {stations_with_temps:,} ({100*stations_with_temps/len(station_data_types):.1f}%)")
    
    # Stations with both temp and precip
    stations_with_temp_and_prcp = sum(1 for dtypes in station_data_types if 'PRCP' in dtypes and any(t in dtypes for t in ['TMIN', 'TMAX', 'TAVG']))
    logger.info(f"Stations with both temperature and precipitation data: {stations_with_temp_and_prcp:,} ({100*stations_with_temp_and_prcp/len(station_data_types):.1f}%)")
    
    # High quality stations (5 years + temp + precip)
    logger.info("\n" + "-" * 80)
    logger.info("HIGH QUALITY STATION ANALYSIS")
    logger.info("-" * 80)
    
    # Get stations with 5 years of data for any measurement
    station_max_years = df_weather.groupby(level='id').apply(
        lambda x: x[year_cols].notna().sum(axis=1).max()
    )
    stations_with_5_years = set(station_max_years[station_max_years == 5].index)
    
    # Combine criteria: 5 years + temp + precip
    high_quality_stations = [
        sid for sid in stations_with_5_years 
        if 'PRCP' in station_data_types[sid] and any(t in station_data_types[sid] for t in ['TMIN', 'TMAX', 'TAVG'])
    ]
    logger.info(f"\nHigh quality stations (5 years + temp + precip): {len(high_quality_stations):,} ({100*len(high_quality_stations)/len(station_data_types):.1f}%)")
    
    # Geographic distribution of high quality stations
    if len(high_quality_stations) > 0:
        hq_stations_data = df_weather.loc[high_quality_stations]
        hq_locs = hq_stations_data[['lat', 'long']].drop_duplicates()
        logger.info(f"High quality station locations: {len(hq_locs):,}")
        
        # Check major cities with high quality stations
        logger.info("\nHigh quality stations near major cities:")
        
        # London area
        london_hq = [sid for sid in high_quality_stations 
                     if df_weather.loc[sid]['lat'].iloc[0] >= 51.3 and df_weather.loc[sid]['lat'].iloc[0] <= 51.7
                     and df_weather.loc[sid]['long'].iloc[0] >= -0.3 and df_weather.loc[sid]['long'].iloc[0] <= 0.1]
        logger.info(f"  London area: {len(london_hq)} station(s)")
        
        # Expand search radius for London
        london_wider = [sid for sid in high_quality_stations 
                        if df_weather.loc[sid]['lat'].iloc[0] >= 51.0 and df_weather.loc[sid]['lat'].iloc[0] <= 52.0
                        and df_weather.loc[sid]['long'].iloc[0] >= -0.5 and df_weather.loc[sid]['long'].iloc[0] <= 0.5]
        logger.info(f"  London wider area (51-52°N, -0.5-0.5°W): {len(london_wider)} station(s)")
        if len(london_wider) > 0:
            logger.info(f"    Station IDs: {london_wider[:5]}")
        
        # UK overall
        uk_stations = [sid for sid in high_quality_stations 
                      if df_weather.loc[sid]['lat'].iloc[0] >= 49.9 and df_weather.loc[sid]['lat'].iloc[0] <= 60.9
                      and df_weather.loc[sid]['long'].iloc[0] >= -8.2 and df_weather.loc[sid]['long'].iloc[0] <= 1.8]
        logger.info(f"  UK overall (49.9-60.9°N, -8.2-1.8°E): {len(uk_stations)} station(s)")
    
    # Continental distribution
    logger.info("\n" + "-" * 80)
    logger.info("CONTINENTAL DISTRIBUTION OF STATIONS")
    logger.info("-" * 80)
    
    # Define rough continental boundaries
    continents = {
        'North America': (15, 72, -170, -50),
        'South America': (-56, 13, -82, -34),
        'Europe': (36, 71, -10, 40),
        'Africa': (-35, 37, -18, 52),
        'Asia': (0, 75, 40, 180),
        'Oceania': (-50, 0, 110, 180)
    }
    
    all_station_ids = df_weather.index.get_level_values('id').unique()
    for continent, (lat_min, lat_max, lon_min, lon_max) in continents.items():
        continent_stations = [
            sid for sid in all_station_ids
            if lat_min <= df_weather.loc[sid]['lat'].iloc[0] <= lat_max
            and lon_min <= df_weather.loc[sid]['long'].iloc[0] <= lon_max
        ]
        logger.info(f"{continent}: {len(continent_stations):,} stations ({100*len(continent_stations)/len(all_station_ids):.1f}%)")
    
    logger.info("\n" + "=" * 80)
    logger.info("END OF DIAGNOSTIC STATISTICS")
    logger.info("=" * 80 + "\n")
    
    exit()
    
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
        logger.warning(f"null values found:\\n{null_counts[null_counts > 0]}")
    
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
        logger.warning(f"Null values found:\\n{null_counts[null_counts > 0]}")
    
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
    """
    Extract unique weather station locations with validation.
    
    2. unique_locs (Extracted locations):
       Columns: lat, long
       - lat: float - Latitude rounded to 3 decimals
       - long: float - Longitude rounded to 3 decimals
       Shape: ~41K rows × 2 columns (one row per unique weather station location)
    """
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
