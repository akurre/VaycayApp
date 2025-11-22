# Module Structure and Dependencies

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  CleanData_MatchCities_ExpandDatesAndWeather.py (Main Script)  │
│                        [18 KB]                                   │
│  • Command-line interface                                        │
│  • Orchestrates all modules                                      │
│  • Main execution flow                                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┬────────────────┐
             │              │              │              │                │
             ▼              ▼              ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  config.py   │ │data_loader.py│ │ geocoding.py │ │data_processor│ │batch_manager │
     │   [3.2 KB]   │ │   [8.7 KB]   │ │   [26 KB]    │ │   [10 KB]    │ │   [6.4 KB]   │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
            │                │                 │                │                │
            │                │                 │                │                │
            ▼                ▼                 ▼                ▼                ▼
     • Paths           • Read CSV      • Worldcities    • Merge data    • Check batches
     • Constants       • Read pickle   • Nominatim      • Pivot data    • Save outputs
     • Settings        • Get locations • City matching  • Clean data    • List batches
     • Logging         • Validation    • Checkpoints    • Validate      • Metadata
```

## Module Dependencies

```
config.py
  └── (no dependencies on other modules)
      Base configuration module

data_loader.py
  └── depends on: config.py
      Uses logger, paths, and constants

geocoding.py
  └── depends on: config.py
      Uses logger, paths, settings, checkpoint functions

data_processor.py
  └── depends on: config.py
      Uses logger and path helpers

batch_manager.py
  └── depends on: config.py
      Uses logger, paths, and directory settings

CleanData_MatchCities_ExpandDatesAndWeather.py
  └── depends on: ALL modules
      Orchestrates the entire workflow
```

## Processing Flow

```
START
  │
  ├─► 1. Parse Arguments (main file)
  │
  ├─► 2. Load Data (data_loader.py)
  │    ├─ read_from_pickle_zip() OR
  │    └─ read_and_prepare_data()
  │
  ├─► 3. Get Unique Locations (data_loader.py)
  │    └─ get_unique_locations()
  │
  ├─► 4. Geocode Locations (geocoding.py)
  │    ├─ load_geocoding_progress() [resume if exists]
  │    ├─ load_worldcities()
  │    └─ reverse_geocode_locations()
  │         ├─ match_station_to_major_city() [primary]
  │         └─ Nominatim fallback [if needed]
  │
  ├─► 5. Filter Weather Data (main file)
  │    └─ Keep only valid geocoded locations
  │
  ├─► 6. Process Batches (batch_manager.py)
  │    ├─ FOR EACH BATCH:
  │    │   ├─ merge_with_original() [data_processor.py]
  │    │   ├─ pivot_and_clean_data() [data_processor.py]
  │    │   ├─ validate_data() [data_processor.py] (optional)
  │    │   └─ save_batch_output() [batch_manager.py]
  │    │
  │    └─ Save summary [batch_manager.py]
  │
  └─► END
```

## File Sizes After Refactoring

| Module | Size | Purpose | Complexity |
|--------|------|---------|------------|
| **Original File** | **~70 KB** | **Everything** | **Very High** |
| ➜ config.py | 3.2 KB | Configuration | Low |
| ➜ data_loader.py | 8.7 KB | Data loading | Medium |
| ➜ geocoding.py | 26 KB | City matching | High |
| ➜ data_processor.py | 10 KB | Transformation | Medium |
| ➜ batch_manager.py | 6.4 KB | Output mgmt | Low |
| ➜ Main (refactored) | 18 KB | Orchestration | Medium |
| **Total** | **~72 KB** | **Same functionality** | **Much better organized** |

## Key Features by Module

### config.py
```
✓ Single source of truth for settings
✓ Easy to modify paths and constants
✓ Centralized logging setup
✓ No code duplication
```

### data_loader.py
```
✓ Handles both CSV and pickle inputs
✓ Date formatting and validation
✓ Coordinate validation
✓ Memory-efficient dtypes
```

### geocoding.py (Largest module)
```
✓ Worldcities matching algorithm
✓ Vectorized distance calculations (FAST!)
✓ One-city-per-station logic
✓ Nominatim fallback
✓ Checkpoint/resume capability
✓ Progress tracking
```

### data_processor.py
```
✓ Safe data merging with validation
✓ Pivot from long to wide format
✓ Temperature unit conversions
✓ Data quality checks
✓ Missing value handling
```

### batch_manager.py
```
✓ Batch existence checking
✓ Incremental processing
✓ Metadata generation
✓ Progress reporting
✓ Summary statistics
```

## Import Patterns

### For External Scripts
```python
# Import everything from package
from utils import (
    logger,
    read_from_pickle_zip,
    load_worldcities,
    validate_data
)

# Or import from specific modules
from utils.geocoding import reverse_geocode_locations
from utils.data_processor import pivot_and_clean_data
```

### For Internal Module Communication
```python
# Modules import from config
from .config import logger, OUTPUT_DIR

# Modules DON'T import from each other
# (prevents circular dependencies)
```

## Testing Strategy

```
test_imports.py
  │
  ├─► Test: Import config module
  ├─► Test: Import data_loader module
  ├─► Test: Import geocoding module
  ├─► Test: Import data_processor module
  ├─► Test: Import batch_manager module
  └─► Report: All imports successful
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Maintainability** | 😟 One 1,400-line file | 😊 Six focused modules |
| **Testability** | 😟 Hard to unit test | 😊 Each module testable |
| **Reusability** | 😟 Must copy functions | 😊 Import what you need |
| **Readability** | 😟 Scroll fatigue | 😊 Quick navigation |
| **Collaboration** | 😟 Merge conflicts | 😊 Work on different modules |
| **Debugging** | 😟 Find needle in haystack | 😊 Know where to look |
| **Documentation** | 😟 Scattered comments | 😊 Module-level docs |

---

**All original comments, functionality, and optimizations have been preserved!**
