# Before Implementation Checklist

Before implementing a new feature or making significant changes, consider:

## Code Reuse
1. **Similar patterns**: Are there existing patterns in the codebase I should follow?
2. **Existing utilities**: Can I reuse existing utility functions, hooks, or components?
3. **Shared types**: Are there existing types/interfaces I should use or extend?
4. **Constants**: Should new configuration values go in the existing constants file?

## Architecture
1. **Component structure**: Where does this fit in the component hierarchy?
2. **State management**: Should this use local state, lifted state, or a store?
3. **Data flow**: How will data flow through components?
4. **File organization**: Where should new files be created?

## Dependencies
1. **New libraries**: Is a new dependency necessary or can we use existing tools?
2. **Bundle impact**: How will this affect bundle size?
3. **API changes**: Will this require server-side changes?

## Type Safety
1. **Type guards**: Will I need type guards? Should they be shared?
2. **Union types**: Are discriminated unions appropriate here?
3. **Type exports**: Which types need to be exported for other files?

## Performance
1. **Data volume**: Will this handle large datasets that need optimization?
2. **Rendering**: Could this cause unnecessary re-renders?
3. **Caching**: Should data be cached?

## Testing
1. **Test strategy**: What tests will be needed?
2. **Mock data**: What mock data structure is required?
3. **Edge cases**: What edge cases should be tested?

## Common Pitfalls
1. **Avoid duplication**: Check for existing implementations before creating new ones
2. **Avoid magic numbers**: Extract to constants immediately
3. **Avoid over-engineering**: Build what's needed, not what might be needed
4. **Avoid tight coupling**: Keep components and functions loosely coupled

## Questions to Answer
- What's the simplest approach that could work?
- Am I following existing patterns in the codebase?
- Will this be easy to test?
- Will this be easy to maintain?
- Am I solving the right problem?

---

After considering these points, proceed with implementation following the standards in `.claudecode/rules.md`.
