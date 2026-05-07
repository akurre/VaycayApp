# Vaycay — Claude instructions

Project-specific rules for AI assistants (Claude Code, Cline, Copilot, etc.) working in this repo. Read in full before making non-trivial changes.

## Project layout

```
client/src/
├── api/<domain>/         # Query hooks grouped by domain (e.g. api/dates/)
├── components/<Name>/    # One folder per major component
│   ├── <Name>.tsx
│   ├── <Subcomponent>.tsx
│   └── helpers.ts
├── constants.ts          # ALL client constants live here
├── hooks/                # Shared hooks
├── stores/               # Zustand stores
├── types/                # Shared type definitions, enums
│   └── <domain>Types.ts  # e.g. cityWeatherDataType.ts, mapTypes.ts
├── utils/
│   ├── typeGuards.ts     # Shared type guards
│   ├── errors/           # parseError, parseErrorAndNotify
│   └── <domain>/         # Domain utilities
├── tests/                # Mirrors src/ structure
└── theme.ts              # appColors live here

server/src/
├── const.ts              # ALL server constants live here
├── types/                # Shared server types
└── utils/                # Server utilities
```

## Code organization

### One function per file (HARD RULE)

Each top-level function gets its own file, named after the function (`hasCoords` → `hasCoords.ts`). Do not export multiple functions from the same file. Index files that only re-export are fine. This is non-negotiable — if a file has two top-level exports, split it.

- Utilities live in the nearest relevant `utils/` (e.g. map utilities in `client/src/components/Map/utils/`).
- React components: one component per file, PascalCase filename matching the component (`CityPopup.tsx`). Default export. No additional exported helpers in component files — extract them.
- File-scoped non-exported helpers inside a component are discouraged; extract when feasible.

### Constants in constants files

All constants go in `client/src/constants.ts` or `server/src/const.ts`. No inline magic numbers, URLs, thresholds, or fixed maps in component/utility files. Import the named constant.

```typescript
// client/src/constants.ts
export const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;
export const CITY_CACHE_MAX_SIZE = 30;
```

### Types in `types/` directories

All type-only declarations (interfaces, types, enums) belong in `client/src/types/` or `server/src/types/`, grouped by domain (`cityWeatherDataType.ts`, `mapTypes.ts`).

**Exception:** component props interfaces stay in the component file.

### Enums for fixed value sets

Use enums, not string-literal unions, for any fixed set of values. Better refactoring + autocomplete.

```typescript
// client/src/types/mapTypes.ts
export enum MapTheme { Light = 'light', Dark = 'dark' }
export enum ViewMode { Heatmap = 'heatmap', Markers = 'markers' }
```

### Theme colors via `appColors`

Never hardcode color strings (`'gray'`, `'#fff'`). Always reference `appColors` from `client/src/theme.ts`.

```typescript
import { appColors } from '@/theme';
<IconSun size={16} color={appColors.dark.textSecondary} />
```

## React + TypeScript

### Imports

- `import type { … }` for type-only imports.
- Use `@/` path aliases for internal imports.
- Order: external → internal utils/hooks → types (`import type`) → styles/assets.

### Props and keys

- **Always destructure props** in the function signature (`({ city }: Props)`), never `Props.city`.
- **Never use array index as a React key.** Use a stable identifier from the data (`id`, `label`, `name`). Static, never-reordered lists are a rare exception — document with a comment.

### Prefer derived state

Don't `useState` + `useEffect` for values you can compute. Don't `useMemo` around already-memoized functions (Zustand selectors are memoized).

```typescript
// Bad
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${firstName} ${lastName}`), [firstName, lastName]);

// Good
const fullName = `${firstName} ${lastName}`;
```

### Zustand: individual selectors

Object destructuring from a Zustand store causes unnecessary re-renders. Use one selector per value.

```typescript
// Bad
const { temperatureUnit, viewMode } = useAppStore();

// Good
const temperatureUnit = useAppStore((s) => s.temperatureUnit);
const viewMode = useAppStore((s) => s.viewMode);
```

### Type safety: no `any`, no casting hacks

- Never use `any` in production code or tests.
- Never `as any`, `as unknown as T`, `@ts-ignore`. `@ts-expect-error` only with a documented reason.
- Function signatures must reflect what the function actually handles. If it handles `null`/`undefined`, type it that way — don't force the signature with casts in tests.
- Prefer type guards and narrowing over assertions. Use `unknown` + guards instead of `any`.
- Shared type guards live in `client/src/utils/typeGuards.ts`.

### Null/undefined: no misleading fallbacks

```typescript
// Bad — 0,0 is a real location (Gulf of Guinea)
minLat: bounds?.minLat ?? 0,

// Good — explicit conditional
variables: bounds ? { minLat: bounds.minLat, maxLat: bounds.maxLat } : defaultBounds,
```

### Effects: clean up subscriptions

Any `useEffect` that adds an event listener, MapLibre handler, timer, interval, or external subscription must return a cleanup function. Stale handlers cause memory leaks and ghost re-renders.

```typescript
// Good
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

Also: dependency arrays must be complete. Don't suppress the lint warning to avoid a re-render — fix the dep, memoize the value, or move the work out of the effect.

## Mantine + Tailwind

**Use Mantine for** interactive components and content elements: `Button`, `Select`, `TextInput`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Modal`, `Menu`, `Tabs`, `Title`, `Text`, `Alert`, `Loader`, etc.

**Do NOT use Mantine for** layout: `Group`, `Stack`, `Container`, `Grid`, `Flex`, `Center`, `Box`, `Space`. Use plain HTML (`div`, `section`) with Tailwind classes for layout/spacing.

```tsx
// Good
<form onSubmit={handleSubmit}>
  <div className="flex gap-4 mt-8">
    <Select placeholder="Month" data={monthOptions} value={month} onChange={setMonth} />
    <Button type="submit">Submit</Button>
  </div>
</form>
```

## Error handling

Use [parseErrorAndNotify](client/src/utils/errors/parseErrorAndNotify.ts) for all user-facing async failures: API/GraphQL calls, hooks doing async work, geolocation, form submits, anything where the user needs feedback. Use `parseError` (no notification) only for programmatic handling, tests, or custom notification logic.

### Context strings

Lowercase, specific, concise. Always include what failed.

```typescript
// Bad
parseErrorAndNotify(error, 'error');
parseErrorAndNotify(error, 'failed to load data');

// Good
const context = cityName ? ` for ${cityName}` : '';
parseErrorAndNotify(error, `failed to load weather data${context}`);
```

### Severity

- `ErrorSeverity.Error` (default) — critical failures (network, API, data corruption). 5s.
- `ErrorSeverity.Warning` — non-critical (optional features, geolocation denied). 3s.
- `ErrorSeverity.Info` — fallback/recovery messaging. 3s.

### Patterns

```typescript
// Apollo
const [fetchWeather] = useLazyQuery(GET_WEATHER, {
  onError: (error) => parseErrorAndNotify(error, 'failed to load weather data'),
});

// async/await
try {
  await updateUserProfile(data);
} catch (error) {
  parseErrorAndNotify(error, 'failed to update profile');
}
```

Never silently swallow errors.

## Performance

### Database queries (Prisma / raw SQL)

- **Use existing indexes.** Check `server/prisma/schema.prisma`. Filter on indexed columns (`date`, `cityId`, `lat`, `long`).
- **Minimize round-trips.** Prefer a single CTE/window-function query over many simple ones. Avoid N+1.
- **Always `LIMIT`.** `MAX_CITIES_GLOBAL_VIEW = 300` is the current cap. Paginate large sets.
- **Prefer `INNER JOIN`** when semantics allow. Filter early (WHERE before JOIN where possible).
- **No `SELECT *`** — name the columns you need.
- **CTE order:** data → filter → aggregate → select. Use `ROW_NUMBER()` for deterministic ranking.

### Caching

- Use `getCachedWeatherData()` for weather queries (1h TTL). Cache keys must include all query parameters.
- Document when cache should be invalidated.

### Targets

- DB: <350ms first request, <5ms cached.
- API: <500ms p95.
- Client interaction: <100ms.
- Map updates: <300ms after debounce.

### Client rendering

- Debounce map zoom/pan: 200ms (already wired). Search inputs: 200–500ms.
- `React.memo` for expensive components only. Don't memoize cheap calculations.
- No inline function definitions in render-heavy paths.
- Cache color calculations for map markers (see `useMapLayers`).
- Pre-compute expensive values in `useMemo` with correct deps.

### Data fetching

- Skip queries when data is cached.
- Use `fetchPolicy: 'network-only'` when relying on a custom cache.
- Batch related queries.

## GraphQL

- Co-locate related queries in `queries.ts`.
- Query names match resolver names.
- Fetch what you need, no more.
- One custom hook per query type (`useWeatherDataForCity`, `useSunshineDataForCity`).
- Hooks return a consistent `{ data, loading, error }` shape.
- Errors flow through `parseErrorAndNotify`.

## Testing

### TDD workflow

After creating any new utility, component, hook, or store, **immediately** write its tests before moving on. Run `npm test` (or `make test`) to verify they pass.

### Location and naming

Tests mirror `client/src/` under `client/src/tests/`. Filename: `<source>.test.ts(x)`.

Example: `client/src/utils/map/getMarkerColor.ts` → `client/src/tests/utils/map/getMarkerColor.test.ts`.

### Conventions

See `client/src/tests/README.md` for the full setup. Highlights:

- Absolute imports with `@/` only.
- `describe` blocks group related tests.
- Descriptive names: `should return X when Y`.
- Components: use the custom `render` from `@/test-utils`.
- Hooks: `renderHook` from `@testing-library/react`, mutations wrapped in `act()`.
- Stores: reset state in `beforeEach`.
- Mock external dependencies (API, stores, `@mantine/notifications`).

### What to cover

Happy path, edge cases (null, undefined, empty arrays), boundary values, error conditions. One behavior per test. Test behavior, not implementation.

### Skip

Pure type definitions, config files, files that only re-export.

## Comments

- Default to none — code should be self-documenting.
- **One line preferred. Two lines max** for genuinely complex logic. If you need more, the code is too clever — refactor.
- Explain *why*, not *what*. JSDoc for public APIs only, never internal helpers.
- Delete outdated or commented-out code.

## Accessibility

- Semantic HTML.
- ARIA labels for interactive elements without visible text.
- Keyboard navigation works.
- Test with a screen reader when shipping new UI.

## Security

- No secrets, API keys, or server-only env vars imported into `client/`. Anything in client code ships in the bundle and is publicly visible.
- `process.env.X` in client code only when prefixed `VITE_` (publicly exposable by design).
- Validate / sanitize user input before SQL queries and HTML rendering.
- Avoid `dangerouslySetInnerHTML` unless the content is trusted and sanitized.

## Pre-PR checklist

- [ ] One function/component per file. Filename matches.
- [ ] No duplicate code (type guards, utilities, constants).
- [ ] Constants used instead of magic numbers; enums used instead of string-literal unions.
- [ ] All async paths handled via `parseErrorAndNotify` with specific context.
- [ ] Types live in `types/` (except component props); shared types are exported.
- [ ] No unnecessary state, no redundant memoization.
- [ ] `import type` used for type-only imports.
- [ ] No hardcoded colors — `appColors` only.
- [ ] No Mantine layout primitives (`Group`/`Stack`/`Container`/`Grid`/`Flex`/`Center`/`Box`/`Space`).
- [ ] No `any`, no casting workarounds.
- [ ] No `key={index}` in `.map()`.
- [ ] Effects clean up listeners/subscriptions/handlers.
- [ ] Comments are one line (max two for complex logic) and explain *why*.
- [ ] No commented-out code.
- [ ] No secrets / server-only env vars in client code.
- [ ] ESLint and TypeScript checks pass.
- [ ] Tests written and passing for new functionality.

## Anti-patterns reference

```typescript
// 1. useState for derived data
const [total, setTotal] = useState(0);
useEffect(() => setTotal(a + b), [a, b]);
// → const total = a + b;

// 2. Redundant memoization of stable functions
const data = useMemo(() => getData(), [getData]);
// → const data = getData();

// 3. Inline duplicated type guard
const isValid = (x): x is Type => 'field' in x;
// → import { isValid } from '@/utils/typeGuards';

// 4. Magic number
if (cache.length > 30) { /* ... */ }
// → import { CITY_CACHE_MAX_SIZE } from '@/constants';

// 5. Generic error message
parseErrorAndNotify(err, 'error');
// → parseErrorAndNotify(err, `failed to load ${resource}`);

// 6. Index as key
{items.map((item, i) => <Row key={i} {...item} />)}
// → {items.map((item) => <Row key={item.id} {...item} />)}

// 7. Mantine for layout
<Group mt="xl" gap="md">…</Group>
// → <div className="flex gap-4 mt-8">…</div>

// 8. Object destructuring from Zustand
const { temperatureUnit, viewMode } = useAppStore();
// → const temperatureUnit = useAppStore((s) => s.temperatureUnit);
```

## Git

- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- One logical change per commit. Reference issue numbers when applicable.
- Concise, clear messages.

---

These rules exist to keep the codebase maintainable. When in doubt, prefer readability and simplicity over cleverness.
