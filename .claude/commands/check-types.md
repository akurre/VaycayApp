---
description: Review type usage and suggest improvements
---

Analyze TypeScript usage in the specified file(s) and suggest improvements for type safety, clarity, and maintainability.

## Type Analysis Checklist

### 1. Type Safety Issues
- Are there any `any` types that should be replaced?
- Are type assertions used safely?
- Are proper type guards in place?
- Are null/undefined handled properly?

### 2. Type Organization
- Should types be extracted to a separate file?
- Are interfaces/types named clearly?
- Are types exported when used across files?
- Should types be in a shared location?

### 3. Type Reusability
- Are there duplicate type definitions?
- Could utility types (Pick, Omit, Partial) simplify definitions?
- Are discriminated unions used where appropriate?
- Can generic types reduce duplication?

### 4. Import Optimization
- Are type-only imports using `import type`?
- Could imports be organized better?

### 5. Function Signatures
- Are parameters typed explicitly?
- Are return types specified?
- Are optional vs required parameters clear?
- Could function overloads improve API?

### 6. Component Props
- Are props interfaces well-defined?
- Are prop types exported for reuse?
- Are children props typed correctly?
- Are event handlers typed properly?

## Specific Issues to Check

### Using `any`
```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good - Use unknown with type guard
function process(data: unknown) {
  if (isValidData(data)) {
    // data is now properly typed
  }
}
```

### Missing Type Guards
```typescript
// ❌ Bad
if ('field' in obj) { ... }

// ✅ Good - Shared type guard
import { isWeatherData } from '@/utils/typeGuards';
if (isWeatherData(obj)) { ... }
```

### Duplicate Types
```typescript
// ❌ Bad - defined in multiple files
interface CityData {
  name: string;
  lat: number;
  long: number;
}

// ✅ Good - shared from types directory
import type { CityData } from '@/types/cityTypes';
```

### Not Using import type
```typescript
// ❌ Bad
import { WeatherData } from '@/types/weather';

// ✅ Good - type-only import
import type { WeatherData } from '@/types/weather';
```

### Vague Union Types
```typescript
// ❌ Bad - hard to discriminate
type Response = SuccessResponse | ErrorResponse;

// ✅ Good - discriminated union
type Response =
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error };
```

## Output Format

For each issue, provide:

### Issue: [Title]
**Severity**: [High / Medium / Low]
**Location**: [File:line numbers]

**Problem**:
```typescript
// Current code
```

**Solution**:
```typescript
// Improved code
```

**Explanation**:
Why this is better and what it prevents.

## Additional Recommendations

- Suggest utility types that could simplify code
- Identify opportunities for generics
- Point out inconsistent type naming
- Recommend type organization improvements

## Type Coverage

Also report on:
- Functions without return type annotations
- Parameters without types
- Exported values without explicit types

Analyze the specified file(s) now and provide detailed type improvement suggestions.
