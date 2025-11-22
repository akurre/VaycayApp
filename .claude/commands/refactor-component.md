---
description: Analyze and suggest refactoring opportunities for a component
---

Analyze the specified component and suggest refactoring improvements to enhance maintainability, performance, and code quality.

## Analysis Areas

### 1. Component Structure
- Is the component doing too much? Should it be split?
- Can any JSX be extracted into sub-components?
- Is the component hierarchy logical?
- Are props well-defined and typed?

### 2. State & Data Flow
- Is state management appropriate for this component?
- Should any state be lifted up or moved to a store?
- Are there derived values stored in state?
- Can any useState be replaced with derived values?

### 3. Side Effects
- Are useEffect calls necessary?
- Are dependencies correct and complete?
- Can any effects be eliminated?
- Should effects be split into separate useEffect calls?

### 4. Performance
- Should expensive calculations be memoized?
- Would useMemo or useCallback improve performance?
- Are there unnecessary re-renders?
- Should React.memo be used?

### 5. Props & API
- Are props well-named and typed?
- Is the component API intuitive?
- Are there too many props (could use a config object)?
- Are required vs optional props clear?

### 6. Logic Extraction
- Should business logic be moved to a custom hook?
- Can utility functions be extracted?
- Are there reusable patterns that should be abstracted?

### 7. Styling & UI
- Are inline styles used appropriately?
- Is Tailwind being used consistently?
- Could styling logic be simplified?

### 8. Accessibility
- Are semantic HTML elements used?
- Are ARIA labels present where needed?
- Is keyboard navigation supported?

## Refactoring Suggestions Format

For each suggestion, provide:

### Suggestion Title
**Type**: [Structure / State / Performance / etc.]
**Impact**: [High / Medium / Low]
**Effort**: [Small / Medium / Large]

**Current Issue**:
```typescript
// Current problematic code
```

**Suggested Refactor**:
```typescript
// Improved code
```

**Rationale**:
- Why this is better
- What benefits it provides
- Any trade-offs to consider

## Priority Levels

**High Priority** (Do these first):
- Issues causing bugs or poor performance
- Significant maintainability problems
- Violations of React best practices

**Medium Priority** (Do when time permits):
- Code clarity improvements
- Minor performance optimizations
- Better abstractions

**Low Priority** (Nice to have):
- Style consistency
- Naming improvements
- Minor refactors

## Example Output

### Extract Complex Logic to Custom Hook
**Type**: Logic Extraction
**Impact**: High
**Effort**: Medium

**Current Issue**:
Component has complex data fetching and caching logic mixed with UI concerns.

**Suggested Refactor**:
Create `useWeatherData` hook to handle all data fetching logic:
```typescript
function useWeatherData(cityName: string) {
  // All data fetching logic here
  return { data, loading, error };
}

// Component becomes simpler
function WeatherDisplay({ cityName }: Props) {
  const { data, loading, error } = useWeatherData(cityName);
  // Just rendering logic here
}
```

**Rationale**:
- Separates concerns (data vs. UI)
- Makes component easier to test
- Logic can be reused in other components
- Follows single responsibility principle

---

Analyze the specified component now and provide actionable refactoring suggestions.
