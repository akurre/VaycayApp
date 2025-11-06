# Error Handling with parseErrorAndNotify

## Intent
Ensure consistent, user-friendly error handling across the application by requiring the use of `parseErrorAndNotify` for all error scenarios in hooks and important functionalities.

## Scope
- Applies to all TypeScript/JavaScript code in the client directory
- Required for all hooks that handle async operations
- Required for all API calls and data fetching operations
- Required for all user-facing error scenarios

## Requirements

### When to Use parseErrorAndNotify

**ALWAYS use `parseErrorAndNotify`** in the following scenarios:

1. **Hooks with Async Operations**
   - Any hook that performs API calls
   - Any hook that handles user location/geolocation
   - Any hook that performs data fetching or mutations
   - Any hook that can fail and needs to inform the user

2. **API Calls and GraphQL Operations**
   - All Apollo GraphQL queries and mutations
   - All REST API calls
   - Any network operations that can fail

3. **User-Facing Operations**
   - Form submissions
   - File uploads
   - Data imports/exports
   - Any operation where the user needs feedback on failure

### When to Use parseError (Without Notification)

Use `parseError` instead of `parseErrorAndNotify` when:
- You need to handle the error programmatically without showing a notification
- You're writing tests and want to verify error parsing logic
- You need to log errors without user notification
- You want to implement custom notification logic

### Implementation Pattern

#### Basic Usage in Hooks
```typescript
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';

export function useDataFetching() {
  const fetchData = async () => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      parseErrorAndNotify(error, 'failed to fetch data');
      return null;
    }
  };

  return { fetchData };
}
```

#### With Context for Better Error Messages
```typescript
try {
  await updateUserProfile(data);
} catch (error) {
  // context helps users understand what operation failed
  parseErrorAndNotify(error, 'failed to update profile');
}
```

#### With Custom Severity
```typescript
import { ErrorSeverity } from '@/types/errorTypes';

try {
  await optionalOperation();
} catch (error) {
  // use warning for non-critical operations
  parseErrorAndNotify(error, 'optional feature unavailable', ErrorSeverity.Warning);
}
```

#### In Apollo GraphQL Hooks
```typescript
const [fetchWeather] = useLazyQuery(GET_WEATHER, {
  onError: (error) => {
    parseErrorAndNotify(error, 'failed to load weather data');
  },
});
```

### Error Context Guidelines

When providing context strings:
- Use lowercase for consistency
- Be specific about what operation failed
- Keep it concise but informative
- Examples:
  - ✅ `'failed to load weather data'`
  - ✅ `'unable to save preferences'`
  - ✅ `'location access denied'`
  - ❌ `'Error'` (too generic)
  - ❌ `'An error occurred while trying to load the weather data from the server'` (too verbose)

### Severity Levels

Choose appropriate severity levels:

- **ErrorSeverity.Error** (default)
  - Use for critical failures that prevent core functionality
  - Network errors, API failures, data corruption
  - Auto-closes after 5 seconds

- **ErrorSeverity.Warning**
  - Use for non-critical issues that don't prevent core functionality
  - Optional features unavailable, degraded performance
  - Auto-closes after 3 seconds

- **ErrorSeverity.Info**
  - Use for informational messages about error recovery
  - Fallback data being used, retry attempts
  - Auto-closes after 3 seconds

## Error Types Handled

The `parseErrorAndNotify` function automatically handles:

1. **Apollo GraphQL Errors**
   - Network errors (connection issues)
   - GraphQL errors (server-side errors)
   - Automatically categorized and formatted

2. **Geolocation Errors**
   - Permission denied
   - Position unavailable
   - Timeout errors
   - Automatically uses Warning severity

3. **Standard JavaScript Errors**
   - Error objects with messages
   - Preserves stack traces in originalError

4. **Unknown Error Types**
   - Gracefully handles any error type
   - Provides generic fallback message

## Benefits

- **Consistency**: All errors are formatted and displayed uniformly
- **User-Friendly**: Technical errors are translated to user-friendly messages
- **Categorization**: Errors are automatically categorized for better handling
- **Flexibility**: Supports custom context and severity levels
- **Type Safety**: Full TypeScript support with proper error types
- **Testability**: Separate `parseError` function for testing without notifications

## Examples

### Good: Comprehensive Error Handling in a Hook
```typescript
import { parseErrorAndNotify } from '@/utils/errors/parseErrorAndNotify';
import { ErrorSeverity } from '@/types/errorTypes';

export function useCitySearch() {
  const [searchCities] = useLazyQuery(SEARCH_CITIES, {
    onError: (error) => {
      parseErrorAndNotify(error, 'failed to search cities');
    },
  });

  const handleSearch = async (query: string) => {
    try {
      const result = await searchCities({ variables: { query } });
      return result.data;
    } catch (error) {
      parseErrorAndNotify(error, 'search operation failed');
      return null;
    }
  };

  return { handleSearch };
}
```

### Good: Geolocation with Appropriate Severity
```typescript
export function useUserLocation() {
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // handle success
      },
      (error) => {
        // geolocation errors are automatically set to Warning severity
        parseErrorAndNotify(error);
      }
    );
  };

  return { getLocation };
}
```

### Bad: Not Using Error Handling
```typescript
// ❌ Bad: No error handling
export function useDataFetching() {
  const fetchData = async () => {
    const result = await apiCall(); // can throw, but not caught
    return result;
  };

  return { fetchData };
}
```

### Bad: Generic Error Messages
```typescript
// ❌ Bad: Generic, unhelpful error message
try {
  await complexOperation();
} catch (error) {
  parseErrorAndNotify(error, 'error'); // too generic
}

// ✅ Good: Specific, helpful error message
try {
  await complexOperation();
} catch (error) {
  parseErrorAndNotify(error, 'failed to process user data');
}
```

## Testing

When testing error handling:
- Use `parseError` to test parsing logic without triggering notifications
- Mock `@mantine/notifications` to verify notification calls
- Test both happy paths and error scenarios

```typescript
import { parseError } from '@/utils/errors/parseError';
import { ErrorCategory } from '@/types/errorTypes';

it('handles network errors correctly', () => {
  const error = { networkError: new Error('failed'), message: 'error' };
  const result = parseError(error);
  
  expect(result.category).toBe(ErrorCategory.Network);
  expect(result.message).toContain('unable to connect');
});
```

## Cline Guidance

When creating or modifying code:
1. Always wrap async operations in try-catch blocks
2. Use `parseErrorAndNotify` in the catch block
3. Provide meaningful context strings
4. Choose appropriate severity levels
5. Test error scenarios thoroughly
6. Never silently swallow errors without user feedback

## Related Rules
- See `.clinerules/04-test-driven-development.md` for testing requirements
- See `.clinerules/05-proper-typescript-typing.md` for error type handling
