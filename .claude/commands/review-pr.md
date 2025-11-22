---
description: Review current changes for code quality issues
---

Review the current git changes (or specified files) for common code quality issues. Check against the standards in `.claudecode/rules.md`.

## Analysis Checklist

### 1. Code Duplication
- Are there any type guards that should be moved to `utils/typeGuards.ts`?
- Are constants defined inline that should be in `constants.ts`?
- Are utility functions duplicated across files?
- Are there repeated patterns that could be abstracted?

### 2. State Management
- Is `useState` being used when data could be derived from props or other state?
- Are already-memoized functions (like zustand selectors) being wrapped in `useMemo`?
- Could any local state be replaced with derived values?
- Are `useEffect` calls updating state that could be computed directly?

### 3. Import Optimization
- Are type-only imports using `import type`?
- Are imports grouped logically (external, internal, types)?
- Are path aliases (@/) being used consistently?

### 4. Constants & Magic Numbers
- Are there hardcoded numbers that should be extracted to constants?
- Are configuration values defined inline instead of in `constants.ts`?
- Are string literals repeated that should be constants?

### 5. Error Handling
- Do error messages include helpful context (city name, user action, etc.)?
- Is `parseErrorAndNotify` being used consistently?
- Are loading and error states handled explicitly?
- Are errors being logged with enough detail for debugging?

### 6. Type Safety
- Are type guards shared or duplicated?
- Are there `any` types that should be `unknown` with proper guards?
- Are interfaces/types exported when used across multiple files?
- Are discriminated unions used where appropriate?

### 7. Performance
- Are expensive calculations properly memoized?
- Are dependency arrays complete and correct?
- Could any components be split to reduce re-renders?
- Are unnecessary re-renders happening due to derived state in useState?

### 8. Code Clarity
- Is complex logic explained with comments?
- Are variable names descriptive?
- Could any IIFEs be replaced with clearer patterns?
- Are there outdated or misleading comments?

### 9. Null/Undefined Handling
- Are fallback values appropriate (avoid `?? 0` for coordinates)?
- Are optional chaining and nullish coalescing used correctly?
- Are null checks clear and intentional?

### 10. React Best Practices
- Are hooks called unconditionally (Rules of Hooks)?
- Are effects cleaned up when necessary?
- Is the component structure logical and maintainable?

## Output Format

For each issue found, provide:
1. **Category**: Which checklist item (e.g., "State Management")
2. **File & Line**: Exact location with line numbers
3. **Issue**: Clear description of the problem
4. **Suggestion**: Specific fix with code example if helpful
5. **Priority**: High/Medium/Low

Example:
```
**Category**: State Management
**File**: client/src/hooks/useData.ts:45-52
**Issue**: Using useState for derived data
**Suggestion**: Replace with: `const fullName = firstName + ' ' + lastName;`
**Priority**: Medium
```

If no issues found, confirm that the code follows all standards.
