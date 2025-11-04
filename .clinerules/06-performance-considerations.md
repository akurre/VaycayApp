# Performance Considerations

## Intent
Ensure all code changes consider performance implications, especially for database queries and data processing operations that handle large datasets.

## Scope
- Applies to all code in the repository, with special focus on:
  - Database queries (Prisma/SQL)
  - API endpoints and GraphQL resolvers
  - Data processing and transformations
  - Client-side rendering and state management

## Requirements

### Database Query Performance

1. **Always Use Indexes**
   - Ensure queries leverage existing database indexes
   - Check `server/prisma/schema.prisma` for available indexes
   - Queries should filter on indexed columns (e.g., `date`, `cityId`, `lat`, `long`)

2. **Minimize Database Round-Trips**
   - Prefer single complex queries over multiple simple queries
   - Use CTEs (Common Table Expressions) and window functions when appropriate
   - Batch operations when possible

3. **Limit Result Sets**
   - Always use `LIMIT` clauses to cap result sizes
   - Current limit: `MAX_CITIES_GLOBAL_VIEW = 300`
   - Consider pagination for large datasets

4. **Optimize Joins**
   - Use `INNER JOIN` when possible (faster than `LEFT JOIN`)
   - Filter early in the query (WHERE before JOIN when possible)
   - Avoid joining on non-indexed columns

### Caching Strategy

1. **Leverage Existing Cache**
   - Use `getCachedWeatherData()` for weather queries
   - Current TTL: 1 hour
   - Cache keys should include all query parameters

2. **Cache Invalidation**
   - Document when cache should be invalidated
   - Consider cache warming for common queries

### Query Complexity

1. **Measure Before Optimizing**
   - Log query execution times (already implemented)
   - Target: <350ms for first request, <5ms for cached
   - Document expected performance in comments

2. **Balance Complexity vs. Performance**
   - Complex queries are acceptable if they reduce round-trips
   - Document trade-offs in comments
   - Example: Adding temperature extremes adds +20-50ms but provides better UX

3. **Avoid N+1 Queries**
   - Use `include` or `select` in Prisma queries
   - Batch data fetching operations
   - Use DataLoader pattern if needed

### Client-Side Performance

1. **Debounce User Interactions**
   - Map zoom/pan events: 200ms debounce (already implemented)
   - Search inputs: 200-500ms debounce
   - Prevent excessive API calls

2. **Optimize Rendering**
   - Use React.memo for expensive components
   - Avoid inline function definitions in render
   - Minimize re-renders with proper dependency arrays

3. **Data Transformation**
   - Transform data on server when possible
   - Cache transformed data client-side
   - Use useMemo for expensive calculations

### SQL Query Guidelines

1. **Window Functions**
   - Efficient for ranking and partitioning
   - Use `ROW_NUMBER()` for deterministic ordering
   - Partition by country for fair distribution

2. **CTE Organization**
   - Order CTEs logically (data → filter → aggregate → select)
   - Name CTEs descriptively
   - Document complex logic with comments

3. **Avoid Subqueries in WHERE**
   - Use CTEs or JOINs instead
   - Exception: Simple EXISTS checks

### Performance Testing

1. **Before Committing**
   - Test queries with realistic data volumes
   - Check server logs for query times
   - Verify no N+1 query patterns

2. **Document Performance**
   - Add comments with expected query times
   - Note any performance trade-offs made
   - Update documentation when optimizing

### Red Flags

Watch out for these performance anti-patterns:

❌ **DON'T:**
- Use `SELECT *` when you only need specific columns
- Add multiple database round-trips when one query would suffice
- Create queries without LIMIT clauses
- Ignore existing indexes when filtering
- Add complex logic without measuring impact
- Use `any` type to bypass performance-related type checks

✅ **DO:**
- Use specific column selection
- Combine operations into single queries
- Always limit result sets
- Filter on indexed columns
- Measure before and after optimization
- Document performance characteristics

## Examples

### Good: Single Query with CTEs
```typescript
// efficient: one query, uses indexes, limits results
const cityIds = await prisma.$queryRaw`
  WITH ranked_cities AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY country ORDER BY population DESC) as rank
    FROM cities
    WHERE date = ${date}  -- indexed column
  )
  SELECT id FROM ranked_cities
  WHERE rank <= 10
  LIMIT 300
`;
```

### Bad: Multiple Queries
```typescript
// inefficient: n+1 queries, no limits
const countries = await prisma.city.findMany({ distinct: ['country'] });
for (const country of countries) {
  const cities = await prisma.city.findMany({
    where: { country: country.country }  // n queries!
  });
}
```

### Good: Caching
```typescript
// efficient: uses cache, logs performance
return getCachedWeatherData(cacheKey, async () => {
  const startTime = Date.now();
  const data = await expensiveQuery();
  console.log(`Query time: ${Date.now() - startTime}ms`);
  return data;
});
```

## Performance Targets

- **Database queries**: <350ms (first), <5ms (cached)
- **API endpoints**: <500ms (p95)
- **Client rendering**: <100ms for interactions
- **Map updates**: <300ms after debounce

## Cline Guidance

When making changes:
1. Check if existing indexes support your query
2. Measure performance impact of new queries
3. Use single queries with CTEs over multiple queries
4. Always include LIMIT clauses
5. Document expected performance in comments
6. Test with realistic data volumes
7. Consider caching for expensive operations

## Related Rules
- See `.clinerules/01-one-function-per-file.md` for code organization
- See `.clinerules/05-proper-typescript-typing.md` for type safety
