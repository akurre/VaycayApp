---
description: Generate comprehensive tests for a file or component
---

Create comprehensive tests for the specified file following the project's testing standards.

## Test Generation Guidelines

### For Utility Functions
- Test the happy path with typical inputs
- Test edge cases (empty arrays, null, undefined, 0, negative numbers)
- Test error conditions
- Test boundary values (min/max)

### For Custom Hooks
- Mock external dependencies (API calls, stores)
- Test initial state
- Test state changes
- Test side effects (useEffect behavior)
- Test cleanup functions
- Test error scenarios

### For React Components
- Test rendering with different props
- Test user interactions (clicks, inputs)
- Test conditional rendering
- Test loading and error states
- Test accessibility (aria labels, keyboard navigation)

### For Type Guards
- Test with valid types
- Test with invalid types
- Test edge cases (null, undefined, partial objects)

## Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
// or jest if that's what you're using

describe('FunctionName or ComponentName', () => {
  describe('specific functionality', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = ...;

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      // ...
    });

    it('should handle empty array', () => {
      // ...
    });
  });

  describe('error conditions', () => {
    it('should throw error when X', () => {
      // ...
    });
  });
});
```

## Mock Examples

### Mocking Zustand Store
```typescript
vi.mock('@/stores/useStore', () => ({
  useStore: vi.fn(() => ({
    data: mockData,
    setData: vi.fn(),
  })),
}));
```

### Mocking Apollo Client
```typescript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [
  {
    request: {
      query: GET_QUERY,
      variables: { id: '1' },
    },
    result: {
      data: { item: { id: '1', name: 'Test' } },
    },
  },
];
```

### Mocking React Hooks
```typescript
vi.mock('react', () => ({
  ...vi.importActual('react'),
  useEffect: vi.fn((f) => f()),
  useMemo: vi.fn((f) => f()),
}));
```

## Output Requirements

1. Create test file in appropriate location:
   - `__tests__/[filename].test.ts` for utilities
   - `[ComponentName].test.tsx` for components (same directory)

2. Include necessary imports and setup

3. Organize tests with clear describe blocks

4. Use descriptive test names following pattern: "should [expected behavior] when [condition]"

5. Add comments for complex test setup

6. Include cleanup in afterEach if needed

7. Aim for high coverage but focus on meaningful tests, not just coverage percentage

## Test Coverage Goals

- **Utilities**: 100% line coverage
- **Hooks**: All state changes and side effects
- **Components**: All user-facing functionality and states
- **Type Guards**: All type scenarios

Generate tests now for the specified file.
