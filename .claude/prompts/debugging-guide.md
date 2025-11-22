# Debugging Guide

When investigating a bug, follow this systematic approach:

## 1. Reproduce the Issue
- [ ] Can you consistently reproduce the bug?
- [ ] What are the exact steps to reproduce?
- [ ] Does it happen in all browsers/environments?
- [ ] Are there any error messages in the console?

## 2. Isolate the Problem
- [ ] Which component/function is involved?
- [ ] What data is being passed?
- [ ] What's the expected vs actual behavior?
- [ ] When did this start happening? (check git history)

## 3. Check Common Issues

### React-Specific
- **Stale closures**: Are hooks capturing old values?
- **Missing dependencies**: Check useEffect/useMemo/useCallback dependency arrays
- **Async state updates**: Is state being updated asynchronously?
- **Key prop issues**: Are list items properly keyed?

### TypeScript Issues
- **Type assertions**: Are type assertions hiding bugs?
- **Loose types**: Is `any` being used inappropriately?
- **Null/undefined**: Are null checks missing?

### Data Flow
- **Props not updating**: Is parent re-rendering?
- **Zustand not updating**: Are selectors correct?
- **Cache stale**: Is cached data being invalidated?
- **API data wrong**: Check network tab for actual response

### Common Pitfalls in This Codebase
- **Derived state**: Is useState being used when data should be derived?
- **Type guards**: Are union types being discriminated correctly?
- **Cache keys**: Are cache keys unique and correct?
- **Bounds checking**: Are map bounds handled properly?

## 4. Add Debug Logging

```typescript
// Temporary debug logs
console.log('🔍 [ComponentName] Props:', props);
console.log('🔍 [ComponentName] State:', state);
console.log('🔍 [ComponentName] Derived:', derivedValue);
```

## 5. Use Browser DevTools

### React DevTools
- Check component props and state
- Profile re-renders
- View component hierarchy

### Network Tab
- Verify API requests/responses
- Check request headers
- Look for failed requests

### Console
- Check for error messages
- Look for warnings
- Verify logged data

## 6. Binary Search Approach
- Comment out half the code
- Does the bug still occur?
- Narrow down to the problematic section
- Repeat until found

## 7. Check Git History
```bash
# When did this break?
git log --oneline -- path/to/file

# What changed?
git diff commit1 commit2 -- path/to/file

# Who changed it?
git blame path/to/file
```

## 8. Common Bug Patterns

### Race Conditions
```typescript
// ❌ Potential race condition
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Handle cleanup
useEffect(() => {
  let mounted = true;
  fetchData().then(data => {
    if (mounted) setData(data);
  });
  return () => { mounted = false; };
}, []);
```

### Stale Closures
```typescript
// ❌ Captures old value
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // Always logs initial value
  }, 1000);
  return () => clearInterval(timer);
}, []); // Missing dependency

// ✅ Uses current value
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // Logs current value
  }, 1000);
  return () => clearInterval(timer);
}, [count]); // Includes dependency
```

### Incorrect Type Guards
```typescript
// ❌ Bad - doesn't narrow type
if ('field' in obj) {
  obj.field; // Still possibly wrong type
}

// ✅ Good - proper type guard
import { isWeatherData } from '@/utils/typeGuards';
if (isWeatherData(obj)) {
  obj.avgTemperature; // Properly typed
}
```

## 9. Document the Fix

Once fixed, document:
1. What was the bug?
2. What was the root cause?
3. How was it fixed?
4. How to prevent similar bugs?

## 10. Prevent Future Bugs

- Add a test that would have caught this
- Add runtime validation if appropriate
- Improve types to make bug impossible
- Document any non-obvious behavior

---

Remember: The best debugging is preventing bugs in the first place through good architecture, types, and tests!
