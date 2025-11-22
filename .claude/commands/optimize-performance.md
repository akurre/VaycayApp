---
description: Identify performance optimization opportunities
---

Analyze the specified component or file for performance issues and optimization opportunities.

## Performance Analysis Areas

### 1. React Re-renders
- Are components re-rendering unnecessarily?
- Should React.memo be used?
- Are props being recreated on every render?
- Should useCallback be used for callbacks passed to children?

### 2. Expensive Computations
- Are there calculations that should be memoized?
- Is useMemo being used appropriately (not for cheap operations)?
- Are dependency arrays correct?

### 3. State Management
- Is useState causing unnecessary re-renders?
- Could state be derived instead of stored?
- Is state being lifted appropriately?
- Are multiple setState calls batched?

### 4. Data Fetching
- Is data being fetched unnecessarily?
- Should data be cached?
- Are queries being deduplicated?
- Is pagination/infinite scroll needed for large datasets?

### 5. Large Lists
- Should virtualization be used (react-window, react-virtual)?
- Are list items properly keyed?
- Could lazy loading improve initial load time?

### 6. Bundle Size
- Are imports optimized (tree-shaking friendly)?
- Are large libraries code-split?
- Could any dependencies be replaced with lighter alternatives?

## Common Performance Issues

### Unnecessary Re-renders
```typescript
// ❌ Bad - creates new function on every render
<Button onClick={() => handleClick(id)} />

// ✅ Good - stable reference
const onClick = useCallback(() => handleClick(id), [id]);
<Button onClick={onClick} />
```

### Expensive Calculations
```typescript
// ❌ Bad - calculated on every render
const sortedData = data.sort((a, b) => a.value - b.value);

// ✅ Good - memoized
const sortedData = useMemo(
  () => data.sort((a, b) => a.value - b.value),
  [data]
);
```

### Derived State in useState
```typescript
// ❌ Bad - unnecessary state and effects
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0));
}, [items]);

// ✅ Good - just derive it
const total = items.reduce((sum, item) => sum + item.price, 0);
```

### Over-memoization
```typescript
// ❌ Bad - unnecessary memoization for cheap operation
const name = useMemo(() => `${first} ${last}`, [first, last]);

// ✅ Good - just compute it
const name = `${first} ${last}`;
```

### Map Without Keys
```typescript
// ❌ Bad - no key or index as key
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ Good - stable unique key
{items.map(item => <Item key={item.id} {...item} />)}
```

## Profiling Recommendations

To identify real performance issues:
1. Use React DevTools Profiler
2. Check for unnecessary re-renders
3. Identify expensive render phases
4. Look for cascading updates

## Output Format

### Issue: [Title]
**Impact**: [High / Medium / Low]
**Type**: [Re-renders / Computation / Data / etc.]
**Location**: [File:lines]

**Problem**:
```typescript
// Current code
```

**Measurement** (if applicable):
- Current render time: X ms
- Number of re-renders: Y
- Bundle impact: Z KB

**Solution**:
```typescript
// Optimized code
```

**Expected Improvement**:
- What this should improve
- Estimated impact

**Trade-offs**:
- Any downsides or increased complexity
- When this optimization may not be worth it

## Performance Checklist

- [ ] No unnecessary re-renders
- [ ] Expensive calculations memoized
- [ ] List items properly keyed
- [ ] Callbacks stabilized with useCallback when needed
- [ ] Large lists virtualized if needed
- [ ] Data fetching optimized
- [ ] Images lazy loaded
- [ ] Bundle size optimized

## When NOT to Optimize

Remember:
- Premature optimization is the root of all evil
- Only optimize if there's a measurable problem
- Simple code > "optimized" complex code
- Profile first, then optimize

Analyze the specified file(s) now and provide actionable performance optimization suggestions.
