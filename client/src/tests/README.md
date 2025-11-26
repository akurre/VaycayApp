# Testing Guide

This directory contains all unit tests for the Vaycay application.

## Test Structure

Tests are organized in a centralized `tests` directory that mirrors the `src` structure:

```
src/tests/
├── components/        # Component tests
├── hooks/            # Custom hook tests
├── stores/           # Zustand store tests
├── utils/            # Utility function tests
└── README.md         # This file
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run tests via Make (from project root)
make test
```

## Writing Tests

### Import Conventions

**Always use absolute imports with the `@/` prefix:**

```typescript
// ✅ Good
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { useWeatherStore } from '@/stores/useWeatherStore';
import Field from '@/components/Map/CityPopup/Field';

// ❌ Bad
import { formatTemperature } from '../../utils/tempFormatting/formatTemperature';
```

### Test File Naming

- Test files should be named `[filename].test.ts` or `[filename].test.tsx`
- Place tests in the `__tests__` directory matching the source file's location

### Utility Function Tests

For pure functions, test:
- Expected behavior with valid inputs
- Edge cases (null, undefined, empty strings, etc.)
- Boundary values
- Error handling

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';

describe('formatTemperature', () => {
  it('formats positive temperature correctly', () => {
    expect(formatTemperature(25.5)).toBe('25.5°C');
  });

  it('returns null for null input', () => {
    expect(formatTemperature(null)).toBeNull();
  });
});
```

### Component Tests

Use the custom `render` function from `test-utils` which includes all providers:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import Field from '@/components/Map/CityPopup/Field';

describe('Field', () => {
  it('renders label and value correctly', () => {
    render(<Field label="Temperature" value="25.5°C" />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('25.5°C')).toBeInTheDocument();
  });
});
```

### Hook Tests

Use `renderHook` from `@testing-library/react`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMapLayers from '@/hooks/useMapLayers';

describe('useMapLayers', () => {
  it('returns an array of layers', () => {
    const { result } = renderHook(() => useMapLayers(mockCities, 'markers'));

    expect(Array.isArray(result.current)).toBe(true);
  });
});
```

### Store Tests

For Zustand stores, reset state before each test:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWeatherStore } from '@/stores/useWeatherStore';

describe('useWeatherStore', () => {
  beforeEach(() => {
    const { setState } = useWeatherStore;
    setState({
      displayedWeatherData: null,
      isLoadingWeather: false,
    });
  });

  it('initializes with null data', () => {
    const { result } = renderHook(() => useWeatherStore());
    expect(result.current.displayedWeatherData).toBeNull();
  });
});
```

## Coverage Goals

- **Target**: 80% coverage across all metrics (lines, functions, branches, statements)
- Coverage thresholds are enforced in `vitest.config.ts`
- Coverage reports are generated in `coverage/` directory

## Mock Data

### Using Mock Data Factories

The `test-utils` file provides convenient factory functions for creating mock data. These factories include all required fields with sensible defaults and allow you to override specific fields:

```typescript
import { 
  createMockWeatherData, 
  createMockSunshineData,
  createMockWeeklyWeather,
  createMockWeekDataPoint
} from '@/test-utils';

// Create mock weather data with defaults
const mockCity = createMockWeatherData();

// Override specific fields
const customCity = createMockWeatherData({
  city: 'Milan',
  country: 'Italy',
  avgTemperature: 25.5,
  population: 1000000,
});

// Create mock sunshine data
const mockSunshine = createMockSunshineData({
  city: 'Barcelona',
  jan: 180,
  jul: 300,
});

// Create mock weekly weather data
const mockWeekly = createMockWeeklyWeather({
  city: 'Paris',
  weeklyData: [
    createMockWeekDataPoint({ week: 1, avgTemp: 20 }),
    createMockWeekDataPoint({ week: 2, avgTemp: 22 }),
  ],
});
```

### Available Factory Functions

- **`createMockWeatherData(overrides?)`** - Creates a complete `WeatherData` object
- **`createMockSunshineData(overrides?)`** - Creates a complete `SunshineData` object
- **`createMockWeeklyWeather(overrides?)`** - Creates a complete `CityWeeklyWeather` object
- **`createMockWeekDataPoint(overrides?)`** - Creates a complete `WeekDataPoint` object

All factories accept an optional `overrides` parameter to customize specific fields while keeping sensible defaults for the rest.

### Manual Mock Data (Legacy)

If you need to create mock data manually, use the complete type:

```typescript
const mockCity: WeatherData = {
  city: 'Milan',
  country: 'Italy',
  state: null,
  suburb: null,
  date: '2024-01-15',
  lat: 45.4642,
  long: 9.19,
  population: 1000000,
  avgTemperature: 25.5,
  minTemperature: 20.0,
  maxTemperature: 30.0,
  precipitation: 10.5,
  snowDepth: null,
  stationName: 'Milan Station',
  submitterId: 'test-1',
};
```

**Note:** Using factory functions is preferred as they ensure all required fields are present and reduce boilerplate.

## CI/CD

Tests run automatically on:
- Pull requests to `master` or `develop`
- Pushes to `master` or `develop`

The workflow is defined in `.github/workflows/test.yml`

## Best Practices

1. **Write descriptive test names** - Test names should clearly describe what is being tested
2. **Test behavior, not implementation** - Focus on what the code does, not how it does it
3. **Keep tests isolated** - Each test should be independent and not rely on others
4. **Use meaningful assertions** - Make sure assertions clearly validate the expected behavior
5. **Test edge cases** - Don't just test the happy path
6. **Keep tests simple** - Tests should be easy to read and understand
7. **Use setup/teardown appropriately** - Use `beforeEach`/`afterEach` to avoid repetition

## Troubleshooting

### Import errors
- Ensure you're using absolute imports with `@/` prefix
- Check that `vite-tsconfig-paths` is installed and configured

### Type errors
- Make sure mock data matches the actual type definitions
- Check `client/src/types/` for the latest type definitions

### Tests not running
- Verify Vitest is installed: `npm list vitest`
- Check `vitest.config.ts` for configuration issues
- Ensure test files match the pattern `**/*.test.{ts,tsx}`
