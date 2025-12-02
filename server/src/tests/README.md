# Server Tests

This directory contains tests for the Vaycay GraphQL server.

## Test Structure

Tests mirror the `src/` directory structure:
- `utils/` - Tests for utility functions
- `graphql/` - Tests for GraphQL resolvers (future)
- etc.

## Running Tests

```bash
# Run all tests from root folder
make test

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Utilities

### `test-utils.ts`

Provides mock data factories for creating test fixtures:

- `createMockCity(overrides?)` - Creates a mock City object
- `createMockStation(overrides?)` - Creates a mock WeatherStation object
- `createMockWeatherRecord(overrides?)` - Creates a mock WeatherRecord object
- `createMockWeatherRecordWithRelations(overrides?)` - Creates a complete mock with all relations

#### Example Usage

```typescript
import { createMockWeatherRecordWithRelations } from '../test-utils';

// Create a basic mock
const mockRecord = createMockWeatherRecordWithRelations();

// Override specific fields
const customMock = createMockWeatherRecordWithRelations({
  city: { id: 999, name: 'Custom City' },
  record: { TAVG: 25.5 },
});
```

## Writing Tests

### Conventions

1. **File Naming**: Name test files as `[filename].test.ts`
2. **Location**: Place tests in corresponding location within `src/tests/`
3. **Structure**: Use `describe` blocks to group related tests
4. **Descriptive Names**: Write clear test names that describe what is being tested

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../utils/myFunction';

describe('myFunction', () => {
  it('handles valid input correctly', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('handles null input', () => {
    const result = myFunction(null);
    expect(result).toBeNull();
  });
});
```

## Coverage

The project aims for 70% test coverage across:
- Lines
- Functions
- Branches
- Statements

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
