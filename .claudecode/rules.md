# Code Quality Rules for Vaycay

## React & TypeScript Standards

### Component Organization
- **One component per file** - Each React component should be in its own file
- **Component file names match component name** - Use PascalCase (e.g., `CityPopup.tsx` for `CityPopup` component)
- **Export components as default exports** - For consistency
- **Co-locate types/interfaces** - Types used only by one component should be defined in that file
- **Separate concerns** - Extract complex logic into custom hooks

### Import Standards
- **Use `import type` for TypeScript types** when importing only types
  ```typescript
  // ✅ Good
  import type { WeatherData } from '@/types/cityWeatherDataType';
  import { useMemo } from 'react';

  // ❌ Bad
  import { WeatherData } from '@/types/cityWeatherDataType';
  ```

- **Group imports logically:**
  1. External libraries (React, third-party)
  2. Internal utilities and hooks
  3. Types (with `import type`)
  4. Styles/assets

- **Use path aliases (@/)** consistently for internal imports

### State Management
- **Avoid useState when data can be derived**
  ```typescript
  // ❌ Bad - unnecessary state
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]);

  // ✅ Good - derived value
  const fullName = `${firstName} ${lastName}`;
  ```

- **Don't wrap already-memoized functions** - Zustand selectors are already memoized
  ```typescript
  // ❌ Bad
  const cachedData = useMemo(() => {
    if (cacheKey) {
      return getFromCache(cacheKey);
    }
    return null;
  }, [cacheKey, getFromCache]);

  // ✅ Good
  const cachedData = cacheKey ? getFromCache(cacheKey) : null;
  ```

- **Derive data instead of storing it** when possible
  ```typescript
  // ❌ Bad
  const [weatherData, setWeatherData] = useState(null);
  useEffect(() => {
    if (response?.data) {
      setWeatherData(response.data);
    }
  }, [response]);

  // ✅ Good
  const weatherData = cachedData?.weatherData || response?.data || null;
  ```

### Code Duplication
- **Extract type guards to shared utilities** (`utils/typeGuards.ts`)
  ```typescript
  // ❌ Bad - duplicated in multiple files
  const isWeatherData = (data: WeatherDataUnion): data is WeatherData => {
    return 'avgTemperature' in data;
  };

  // ✅ Good - shared in utils/typeGuards.ts
  import { isWeatherData } from '@/utils/typeGuards';
  ```

- **Use constants from central file** instead of magic numbers
  ```typescript
  // ❌ Bad
  maxCacheSize: 30, // What is 30? Why 30?

  // ✅ Good
  import { CITY_CACHE_MAX_SIZE } from '@/constants';
  maxCacheSize: CITY_CACHE_MAX_SIZE,
  ```

- **Share utility functions** - Don't duplicate logic across files

### Error Handling
- **Use parseErrorAndNotify consistently** for all GraphQL/API errors
- **Include context in error messages**
  ```typescript
  // ❌ Bad - generic message
  parseErrorAndNotify(error, 'failed to load data');

  // ✅ Good - specific context
  const context = cityName ? ` for ${cityName}` : '';
  parseErrorAndNotify(error, `failed to load weather data${context}`);
  ```

- **Handle loading and error states explicitly** in components

### Performance
- **Pre-compute expensive calculations** in useMemo
- **Use proper dependency arrays** - include all dependencies
- **Avoid unnecessary re-renders** - derive state when possible
- **Cache color calculations** for map markers (see useMapLayers pattern)

### Type Safety
- **Create shared type guards** in `utils/typeGuards.ts`
- **Use discriminated unions** where appropriate
- **Avoid 'any' type** - use 'unknown' and type guards instead
- **Export interfaces** that are used in multiple files

### Null/Undefined Handling
- **Don't use misleading fallbacks**
  ```typescript
  // ❌ Bad - 0,0 is a real location (Gulf of Guinea)
  minLat: bounds?.minLat ?? 0,

  // ✅ Good - explicit conditional
  variables: bounds ? {
    minLat: bounds.minLat,
    maxLat: bounds.maxLat,
  } : defaultBounds,
  ```

### Comments
- **Remove obvious comments** - code should be self-documenting
- **Remove outdated comments** - delete comments about things that don't work
- **Use JSDoc for public APIs** - document complex functions
- **Explain "why" not "what"** - if code needs a comment, explain reasoning

## GraphQL Standards

### Query Organization
- **Co-locate related queries** in the same section of `queries.ts`
- **Use descriptive query names** that match resolver names
- **Include all necessary fields** but avoid over-fetching

### Custom Hooks for Queries
- **One hook per query type** (e.g., `useWeatherDataForCity`, `useSunshineDataForCity`)
- **Include caching logic** when appropriate
- **Handle errors with parseErrorAndNotify**
- **Return consistent shape** (`{ data, loading, error }`)

## File Organization

```
client/src/
├── api/
│   └── dates/           # Query hooks organized by domain
├── components/
│   └── [Component]/     # Each major component gets a folder
│       ├── Component.tsx
│       ├── Subcomponent.tsx
│       └── helpers.ts
├── constants.ts         # All constants in one place
├── hooks/               # Shared hooks
├── stores/              # Zustand stores
├── types/               # Type definitions
└── utils/
    ├── typeGuards.ts    # Shared type guards
    ├── errors/          # Error handling utilities
    └── [domain]/        # Domain-specific utilities
```

## Testing Requirements

### Unit Tests
- Write tests for all utility functions
- Test edge cases (null, undefined, empty arrays)
- Test error conditions
- Use descriptive test names: `should return X when Y`

### Integration Tests
- Test custom hooks with mock data
- Test component rendering with different props
- Test user interactions

### Test Organization
- Place tests in `__tests__` directory or alongside file as `.test.ts`
- Mock external dependencies (API calls, stores)
- Use `describe` blocks to group related tests

## Code Review Checklist

Before submitting a PR, verify:

- [ ] No duplicate code (check for repeated type guards, utilities, constants)
- [ ] Constants used instead of magic numbers
- [ ] Proper error handling with context
- [ ] Types properly defined and shared when used across files
- [ ] No unnecessary state or memoization
- [ ] Clear, documented logic for complex operations
- [ ] Import type used for type-only imports
- [ ] Consistent naming conventions
- [ ] No commented-out code
- [ ] ESLint and TypeScript checks pass

## Common Anti-Patterns to Avoid

### ❌ Bad Patterns
```typescript
// 1. useState for derived data
const [total, setTotal] = useState(0);
useEffect(() => setTotal(a + b), [a, b]);

// 2. Redundant memoization
const data = useMemo(() => getData(), [getData]); // getData is stable

// 3. Inline type guards (duplicated)
const isValid = (x): x is Type => 'field' in x;

// 4. Magic numbers
if (cache.length > 30) { /* ... */ }

// 5. Generic errors
parseErrorAndNotify(err, 'error');
```

### ✅ Good Patterns
```typescript
// 1. Derive data
const total = a + b;

// 2. Trust stable functions
const data = getData();

// 3. Shared type guards
import { isValid } from '@/utils/typeGuards';

// 4. Named constants
import { MAX_CACHE_SIZE } from '@/constants';
if (cache.length > MAX_CACHE_SIZE) { /* ... */ }

// 5. Contextual errors
parseErrorAndNotify(err, `failed to load ${resource}`);
```

## Performance Guidelines

### Map Layers (Deck.gl)
- Pre-compute colors in useMemo with proper dependencies
- Use color caching for large datasets
- Limit rendered markers with `maxCitiesToShow`
- Use transitions for smooth animations

### React Rendering
- Memoize expensive calculations, not cheap ones
- Use proper dependency arrays
- Derive state when possible
- Split large components into smaller ones

### Data Fetching
- Implement caching (see LRU cache in `useCityDataCacheStore`)
- Skip queries when data is cached
- Use `fetchPolicy: 'network-only'` when using custom cache
- Batch related queries when possible

## Accessibility

- Use semantic HTML
- Include aria labels for interactive elements
- Ensure keyboard navigation works
- Test with screen readers when adding new UI

## Git Commit Standards

- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Write clear, concise commit messages
- One logical change per commit
- Reference issue numbers when applicable

---

**Remember**: These rules exist to make code more maintainable, not to slow you down. When in doubt, prioritize readability and simplicity over cleverness.
