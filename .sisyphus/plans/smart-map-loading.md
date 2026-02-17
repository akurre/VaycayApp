# Smart Map Loading Strategy

## TL;DR

> **Quick Summary**: Redesign the WorldMap loading UX to differentiate between pan/zoom loads (non-blocking, stale-while-revalidate with subtle breathe animation) and date/dataType changes (keep blocking overlay). Add ghost dots for viewport-edge feedback, fix double-opacity bug, and 3 bonus UI improvements.
> 
> **Deliverables**:
> - Tiered loading system: context-aware overlay vs subtle breathe animation
> - Ghost dot placeholders at viewport edges during pan loads
> - Double-opacity fix (remove wrapper fade for pan loads)
> - Tooltip edge-clipping fix
> - Always-render map shell (no blank flash)
> - handleHover callback optimization
> - Unit tests for loading tier detection logic
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 6 → Task 9 → F1-F4

---

## Context

### Original Request
The WorldMap shows a full blocking loading overlay (semi-transparent background + Mantine Loader + 0.3 opacity fade) whenever ANY data is loading. This is appropriate for date/dataType changes where old data is wrong, but distracting during pan/zoom interactions where old data is still mostly valid. User wants a smarter, tiered approach that keeps the map interactive during pans while still providing visual feedback that data is updating.

### Interview Summary
**Key Discussions**:
- Pan loads: NO blocking overlay. Keep stale dots visible + fully interactive (clickable)
- Loading indicator for pans: DeckGL opacity transition breathe (0.5↔0.8), GPU-handled, zero overhead
- Ghost dots: Fill empty viewport zones organically where data is expected but not yet loaded
- Timeout safety: Tier 2 breathe escalates to Tier 1 (blocking overlay) after 3 seconds
- Concurrent loads: Tier 1 (date change) always takes precedence over Tier 2 (pan)
- Apply to both marker AND heatmap view modes
- Include 3 bonus UI fixes: tooltip clipping, conditional map render, handleHover optimization

**Research Findings**:
- Apollo `cache-and-network` already returns cached data instantly during refetch — stale dots persist naturally
- `MapPage` only updates `displayedData` when `!isLoading` (line 121-122) — Zustand store retains stale data
- `dataHasChanged` variable already computed in `WorldMap.tsx` (lines 183-187) but **unused** for overlay differentiation
- DeckGL ScatterplotLayer already has enter transitions (radius grow from 0) and opacity transitions
- Home location pulse pattern in `useHomeLocationLayers.ts` uses rAF+15fps — DeckGL transitions are lighter weight
- `LOADER_DELAY_MS` (300ms) races with `useMapBounds` debounce (200ms) causing brief loader flashes on fast loads
- Loading overlay `z-10` + `backdrop-blur-sm` blocks pointer events even though interactions aren't logically disabled
- Double opacity: markers at 0.5 (useMapLayers) AND wrapper at 0.3 (WorldMap) = 0.15 effective opacity during loading

### Metis Review
**Identified Gaps** (addressed):
- Ghost dot placement algorithm undefined → Resolved: organic scatter in empty viewport zones
- Ghost dot lifecycle undefined → Resolved: fade out over 200ms when real data arrives
- Tooltip fix approach undefined → Resolved: reposition/flip near viewport edges
- "Map shell" undefined → Resolved: DeckGL canvas + MapLibre basemap, empty layers
- handleHover optimization unclear → Resolved: stabilize callback identity via ref for cities
- Mode switch during load undefined → Resolved: allow freely, accept brief transition
- Long load timeout undefined → Resolved: escalate to Tier 1 after 3 seconds
- Concurrent Tier 1+2 undefined → Resolved: Tier 1 takes precedence
- HeatmapLayer transition support uncertain → Must verify during implementation, fall back to opacity-only if needed

---

## Work Objectives

### Core Objective
Replace the one-size-fits-all blocking loading overlay with a context-aware tiered loading system that keeps the map interactive during pan/zoom while properly blocking during data-invalidating changes.

### Concrete Deliverables
- Modified `WorldMap.tsx` with tiered loading overlay logic
- New `useLoadingTier` hook encapsulating tier detection
- New `useGhostDots` hook for placeholder dot generation
- New `useBreatheAnimation` hook for DeckGL opacity cycling
- Modified `useMapLayers.ts` with breathe animation + ghost dot integration
- Modified `MapTooltip.tsx` with viewport-aware repositioning
- Modified `MapPage` (map.tsx) to always render WorldMap (no conditional)
- Modified `useMapInteractions.ts` with stable callback identity
- Unit tests for loading tier detection logic
- Vitest tests for tooltip repositioning logic

### Definition of Done
- [ ] Pan/zoom interactions never show the blocking overlay (stale dots remain visible and clickable)
- [ ] Date slider changes and dataType toggle still show the blocking overlay
- [ ] Markers/heatmap gently breathe (opacity pulse) during pan loads
- [ ] Ghost dots appear in empty viewport zones during pan loads and fade out when data arrives
- [ ] Tier 2 escalates to Tier 1 after 3 seconds of loading
- [ ] Tooltip never clips off-screen edges
- [ ] Map basemap always visible (no white flash on initial load)
- [ ] All existing tests pass: `cd client && npx vitest run`
- [ ] New tests pass for tier detection and tooltip logic

### Must Have
- Loading tier detection based on what triggered the load (pan vs date vs dataType)
- Non-blocking panning experience with stale-while-revalidate
- Visual "breathe" feedback during pan loads (DeckGL opacity transition)
- Ghost dots in empty viewport zones during pan loads
- Full blocking overlay preserved for date/dataType changes
- 3-second timeout escalation from Tier 2 → Tier 1
- Tier 1 precedence when concurrent with Tier 2
- Tooltip viewport-aware repositioning
- Always-rendered map shell
- Stable handleHover callback identity

### Must NOT Have (Guardrails)
- No custom `requestAnimationFrame` loops for the breathe animation — use DeckGL transitions API only
- No loading percentage/progress indicators (out of scope)
- No toast notifications ("Data updated!" popups)
- No prefetching adjacent viewport data
- No changes to Apollo queries, GraphQL schema, or server code
- No changes to Zustand store structure (only consume differently)
- No manual refresh button
- No analytics events
- No animation customization UI/settings
- No changes to marker distribution algorithm
- Ghost dots must NOT appear during Tier 1 (date/dataType) loads
- Ghost dots must NOT persist after real data arrives (fade out in ≤200ms)
- Breathe animation must NOT block pointer events (hover, click must work throughout)
- Do NOT over-engineer ghost dot placement — simple scatter, not density-aware clustering

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest + @testing-library/react, 55 existing test files)
- **Automated tests**: YES (tests-after)
- **Framework**: Vitest
- **Pattern to follow**: `client/src/tests/` directory structure

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

| Deliverable Type | Verification Tool | Method |
|------------------|-------------------|--------|
| Loading tier logic | Bash (vitest) | Unit tests for `useLoadingTier` hook |
| Visual behavior | Playwright (playwright skill) | Navigate map, pan, change dates, screenshot |
| Tooltip fix | Playwright (playwright skill) | Hover near edges, verify tooltip position |
| Performance | Bash (vitest) | Timing assertions in test |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — types, hooks, detection logic):
├── Task 1: Create useLoadingTier hook (tier detection logic) [deep]
├── Task 2: Create useBreatheAnimation hook (DeckGL opacity cycling) [quick]
├── Task 3: Fix MapTooltip edge-clipping [quick]
├── Task 4: Fix MapPage conditional render (always show map shell) [quick]
└── Task 5: Optimize useMapInteractions handleHover callback [quick]

Wave 2 (Integration — wire hooks into WorldMap, add ghost dots):
├── Task 6: Refactor WorldMap.tsx to use tiered loading (depends: 1, 2) [deep]
├── Task 7: Create useGhostDots hook + integrate into useMapLayers (depends: 1) [deep]
└── Task 8: Fix double-opacity issue in useMapLayers (depends: 6) [quick] — runs AFTER Task 6 or merged into it

Wave 3 (Tests + Polish):
├── Task 9: Unit tests for useLoadingTier + useBreatheAnimation (depends: 1, 2, 6) [unspecified-high]
├── Task 10: Unit tests for MapTooltip repositioning (depends: 3) [quick]
└── Task 11: Integration QA — full Playwright verification (depends: 6, 7, 8) [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 6 → Task 9 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| 1 | — | 6, 7, 8, 9 | 1 |
| 2 | — | 6, 9 | 1 |
| 3 | — | 10 | 1 |
| 4 | — | 11 | 1 |
| 5 | — | 11 | 1 |
| 6 | 1, 2 | 9, 11 | 2 |
| 7 | 1 | 11 | 2 |
| 8 | 6 | 11 | 2 (after T6) |
| 9 | 1, 2, 6 | F1-F4 | 3 |
| 10 | 3 | F1-F4 | 3 |
| 11 | 6, 7, 8 | F1-F4 | 3 |

### Agent Dispatch Summary

| Wave | # Parallel | Tasks → Agent Category |
|------|------------|----------------------|
| 1 | **5** | T1 → `deep`, T2 → `quick`, T3 → `quick`, T4 → `quick`, T5 → `quick` |
| 2 | **3** | T6 → `deep`, T7 → `deep`, T8 → `quick` |
| 3 | **3** | T9 → `unspecified-high`, T10 → `quick`, T11 → `unspecified-high` |
| FINAL | **4** | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

- [ ] 1. Create `useLoadingTier` hook — Loading cause detection and tier assignment

  **What to do**:
  - Create a new hook `client/src/hooks/useLoadingTier.ts`
  - The hook takes: `isLoading: boolean`, `debouncedDate: string | undefined`, `selectedMonth: number`, `dataType: DataType`, `isBasemapLoaded: boolean`
  - Track previous values of `debouncedDate`, `selectedMonth`, and `dataType` via refs
  - On each render where `isLoading` is true, determine WHY loading started:
    - If `debouncedDate`, `selectedMonth`, or `dataType` changed since last non-loading render → **Tier 1** (data-invalidating change)
    - If none of the above changed but `isLoading` is true → **Tier 2** (pan/zoom bounds change)
    - If basemap not loaded → **Tier 1** (initial load)
  - Implement 3-second timeout: if Tier 2 has been active for >3000ms continuously, escalate to Tier 1
  - Implement Tier 1 precedence: if currently Tier 1, ignore any concurrent Tier 2 conditions
  - Return: `{ tier: 'none' | 'tier1' | 'tier2', isDataChange: boolean, isPanLoad: boolean }`
  - Update previous value refs only when loading transitions from true → false (load completes)
  - Export the `LoadingTier` type for consumers

  **Must NOT do**:
  - Do NOT use `requestAnimationFrame` or animation loops in this hook
  - Do NOT modify any existing files — this is a brand new file
  - Do NOT add Zustand store dependencies — keep this as a pure React hook
  - Do NOT add visual/UI logic — this is pure state detection

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: State machine logic with edge cases (timeout escalation, tier precedence, ref tracking). Requires careful reasoning about timing and state transitions.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No visual work in this task
    - `playwright`: No browser testing in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 9
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL):

  **Pattern References** (existing code to follow):
  - `client/src/components/Map/WorldMap.tsx:69-72` — The existing `prevDebouncedDateRef`, `prevMonthRef`, `prevDataTypeRef` pattern. This is the EXACT detection logic to extract into the hook. Lines 183-187 compute `dataHasChanged` — replicate this logic.
  - `client/src/components/Map/WorldMap.tsx:87-88` — How `isLoading` is derived from `isLoadingWeather` / `isLoadingSunshine` based on `dataType`. The hook should accept a unified `isLoading` boolean.
  - `client/src/components/Map/WorldMap.tsx:181-226` — The current `useEffect` that manages loading state. This is what the hook REPLACES (the detection part, not the visual part).

  **API/Type References**:
  - `client/src/types/mapTypes.ts` — `DataType` enum used to detect dataType changes
  - `client/src/const.ts:279` — `LOADER_DELAY_MS = 300` — reference for timing constants. Add a new constant `TIER2_ESCALATION_MS = 3000`.

  **Test References**:
  - `client/src/tests/stores/useWeatherStore.test.ts` — Example of how Zustand store tests are structured. The new hook test will follow similar patterns.

  **WHY Each Reference Matters**:
  - WorldMap lines 69-72: These are the exact refs you need to replicate. The hook extracts this pattern so WorldMap doesn't own it.
  - WorldMap lines 183-187: The `dataHasChanged` computation is the core tier detection algorithm. Move it into the hook.
  - WorldMap lines 181-226: Understand the full effect to know what stays in WorldMap (visual logic) vs what moves to the hook (detection logic).

  **Acceptance Criteria**:

  - [ ] New file exists: `client/src/hooks/useLoadingTier.ts`
  - [ ] Exports `useLoadingTier` hook and `LoadingTier` type
  - [ ] Returns `tier: 'none'` when `isLoading` is false
  - [ ] Returns `tier: 'tier1'` when loading AND date/month/dataType changed
  - [ ] Returns `tier: 'tier1'` when basemap not loaded
  - [ ] Returns `tier: 'tier2'` when loading AND no date/month/dataType change
  - [ ] Escalates from `tier2` to `tier1` after 3000ms continuous Tier 2 loading
  - [ ] Tier 1 takes precedence over concurrent Tier 2
  - [ ] `TIER2_ESCALATION_MS` constant added to `client/src/const.ts`
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tier detection for date change
    Tool: Bash (vitest)
    Preconditions: Hook rendered with isLoading=false, debouncedDate="0315"
    Steps:
      1. Re-render hook with isLoading=true, debouncedDate="0720"
      2. Read result.tier
    Expected Result: tier === 'tier1'
    Failure Indicators: tier is 'tier2' or 'none'
    Evidence: .sisyphus/evidence/task-1-tier1-date-change.txt

  Scenario: Tier detection for pan/zoom
    Tool: Bash (vitest)
    Preconditions: Hook rendered with isLoading=false, debouncedDate="0315"
    Steps:
      1. Re-render hook with isLoading=true, debouncedDate="0315" (same date)
      2. Read result.tier
    Expected Result: tier === 'tier2'
    Failure Indicators: tier is 'tier1' or 'none'
    Evidence: .sisyphus/evidence/task-1-tier2-pan.txt

  Scenario: Tier 2 escalation after 3 seconds
    Tool: Bash (vitest with fake timers)
    Preconditions: Hook in Tier 2 state
    Steps:
      1. Use vi.useFakeTimers()
      2. Set hook to isLoading=true with same date (Tier 2)
      3. Advance timer by 3001ms
      4. Read result.tier
    Expected Result: tier === 'tier1' (escalated)
    Failure Indicators: tier is still 'tier2'
    Evidence: .sisyphus/evidence/task-1-tier2-escalation.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-tier1-date-change.txt — vitest output showing Tier 1 detection
  - [ ] task-1-tier2-pan.txt — vitest output showing Tier 2 detection
  - [ ] task-1-tier2-escalation.txt — vitest output showing timeout escalation

  **Commit**: YES
  - Message: `feat(map): add useLoadingTier hook for context-aware loading detection`
  - Files: `client/src/hooks/useLoadingTier.ts`, `client/src/const.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 2. Create `useBreatheAnimation` hook — DeckGL opacity cycling for Tier 2

  **What to do**:
  - Create a new hook `client/src/hooks/useBreatheAnimation.ts`
  - The hook takes: `isActive: boolean` (whether breathe should be running), `minOpacity: number` (default 0.5), `maxOpacity: number` (default 0.8), `cycleDurationMs: number` (default 1200)
  - When `isActive` is true, use a simple `setInterval` or `useEffect` + `setTimeout` to toggle an opacity state between min and max
  - The hook does NOT drive animation directly — it returns the current target opacity value. DeckGL's built-in `transitions.opacity` on the layer will handle smooth interpolation.
  - When `isActive` becomes false, immediately return `maxOpacity` (full opacity, no animation)
  - Return: `{ opacity: number }`
  - Add constants to `client/src/const.ts`: `BREATHE_MIN_OPACITY = 0.5`, `BREATHE_MAX_OPACITY = 0.8`, `BREATHE_CYCLE_MS = 1200`

  **Must NOT do**:
  - Do NOT use `requestAnimationFrame` — DeckGL handles the interpolation
  - Do NOT modify any existing components — this is a new standalone hook
  - Do NOT make this hook aware of loading tiers — it just takes a boolean `isActive`
  - Do NOT create a complex state machine — this is literally toggling between two values on a timer

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple timer-based state toggle. Minimal logic.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `client/src/hooks/useHomeLocationLayers.ts:51-77` — Existing animation loop pattern. DO NOT copy this approach (rAF is overkill). Reference it to understand what NOT to do for this simpler use case.
  - `client/src/hooks/useMapLayers.ts:129-145` — Existing ScatterplotLayer `transitions` config. The breathe hook's output will feed into this layer's `opacity` prop, and DeckGL's existing `transitions.opacity` (duration: 300, easing) will handle smooth interpolation.

  **API/Type References**:
  - `client/src/const.ts` — Where to add the new `BREATHE_*` constants. Follow the existing constant grouping pattern (see `WORLD MAP BIG LOADER CONSTANTS` section at line 276).

  **WHY Each Reference Matters**:
  - `useHomeLocationLayers.ts`: Shows the over-engineered approach for reference. Your hook is simpler — just toggle a number on an interval.
  - `useMapLayers.ts:129-145`: Shows the CONSUMER of your hook's output. The `opacity` value you return will be passed as the layer's `opacity` prop, and the existing `transitions.opacity` config handles smooth GPU interpolation.

  **Acceptance Criteria**:

  - [ ] New file exists: `client/src/hooks/useBreatheAnimation.ts`
  - [ ] Exports `useBreatheAnimation` hook
  - [ ] Returns `{ opacity: 0.8 }` when `isActive` is false (full opacity)
  - [ ] Toggles opacity between 0.5 and 0.8 when `isActive` is true
  - [ ] Cycle duration is ~1200ms (600ms at each level)
  - [ ] Cleans up interval/timeout on unmount
  - [ ] Constants added to `client/src/const.ts`: `BREATHE_MIN_OPACITY`, `BREATHE_MAX_OPACITY`, `BREATHE_CYCLE_MS`
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Opacity returns max when inactive
    Tool: Bash (vitest)
    Preconditions: Hook rendered with isActive=false
    Steps:
      1. Read result.opacity
    Expected Result: opacity === 0.8 (BREATHE_MAX_OPACITY)
    Evidence: .sisyphus/evidence/task-2-inactive-opacity.txt

  Scenario: Opacity toggles when active
    Tool: Bash (vitest with fake timers)
    Preconditions: Hook rendered with isActive=true
    Steps:
      1. vi.useFakeTimers()
      2. Read initial opacity (should be minOpacity or maxOpacity)
      3. Advance timer by 600ms
      4. Read opacity (should have toggled)
      5. Advance timer by 600ms
      6. Read opacity (should have toggled back)
    Expected Result: Opacity alternates between 0.5 and 0.8
    Evidence: .sisyphus/evidence/task-2-breathe-cycle.txt
  ```

  **Commit**: YES
  - Message: `feat(map): add useBreatheAnimation hook for subtle loading feedback`
  - Files: `client/src/hooks/useBreatheAnimation.ts`, `client/src/const.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 3. Fix MapTooltip edge-clipping

  **What to do**:
  - Modify `client/src/components/Map/MapTooltip.tsx`
  - Add viewport-aware repositioning logic:
    - Use a `ref` on the tooltip div to measure its rendered dimensions (`getBoundingClientRect`)
    - Use `useEffect` or `useLayoutEffect` to check if tooltip would overflow viewport edges
    - If tooltip would clip right edge: position to the LEFT of the cursor instead (`left: x - tooltipWidth - 10`)
    - If tooltip would clip bottom edge: position ABOVE the cursor instead (`top: y - tooltipHeight - 10`)
    - Handle corner case: if BOTH right and bottom clip, position top-left of cursor
  - Keep the existing styling, backgroundColor, textColor logic unchanged
  - Add a small state: `[adjustedPosition, setAdjustedPosition]` that gets calculated after the first render

  **Must NOT do**:
  - Do NOT change the tooltip content or styling
  - Do NOT use a portal (too complex for this fix)
  - Do NOT add scroll behavior to the tooltip
  - Do NOT change the tooltip component API (still takes `x, y, content` props)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file change, well-understood DOM measurement pattern.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Tooltip positioning is a UI/UX concern — this skill understands viewport edge handling patterns.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Task 10
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/components/Map/MapTooltip.tsx` — The complete file. Only 35 lines. The fix adds viewport measurement logic.

  **WHY Each Reference Matters**:
  - The entire file is the scope. Understand the current `left: x + 10, top: y + 10` positioning to replace with smart positioning.

  **Acceptance Criteria**:

  - [ ] MapTooltip no longer clips when hovering markers near right viewport edge
  - [ ] MapTooltip no longer clips when hovering markers near bottom viewport edge
  - [ ] MapTooltip correctly flips to top-left when both right and bottom would clip
  - [ ] Normal tooltip positioning (center of viewport) unchanged
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tooltip flips left near right edge
    Tool: Playwright (playwright skill)
    Preconditions: App running at localhost:3000, map loaded with markers in marker view
    Steps:
      1. Navigate to http://localhost:3000?date=0715
      2. Wait for map to fully load (no loading overlay visible)
      3. Find a marker dot near the right edge of the viewport (within 200px of right edge)
      4. Hover over the marker dot
      5. Take screenshot
      6. Assert tooltip element is visible and its right edge (getBoundingClientRect().right) is <= window.innerWidth
    Expected Result: Tooltip appears to the LEFT of the cursor, fully within viewport
    Failure Indicators: Tooltip right edge exceeds viewport width, or tooltip not visible
    Evidence: .sisyphus/evidence/task-3-tooltip-right-edge.png

  Scenario: Tooltip positions normally in center
    Tool: Playwright (playwright skill)
    Preconditions: Same as above
    Steps:
      1. Find a marker dot near the CENTER of the viewport
      2. Hover over the marker dot
      3. Assert tooltip appears to the right and below cursor (standard position)
    Expected Result: Tooltip at x+10, y+10 as before
    Evidence: .sisyphus/evidence/task-3-tooltip-normal.png
  ```

  **Commit**: YES
  - Message: `fix(map): prevent tooltip from clipping off viewport edges`
  - Files: `client/src/components/Map/MapTooltip.tsx`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 4. Fix MapPage conditional render — always show map shell

  **What to do**:
  - Modify `client/src/pages/map.tsx`
  - Currently line 196: `{displayedData && (<WorldMap ...>)}` — this means the ENTIRE map (DeckGL canvas + MapLibre basemap) disappears when `displayedData` is null
  - Change to ALWAYS render `<WorldMap>`, passing `cities={displayedData ?? []}` (empty array instead of null check)
  - This ensures the MapLibre basemap tiles + DeckGL canvas are always visible, even during initial load
  - The map simply shows no data layers when `cities` is empty (layers handle empty arrays gracefully — ScatterplotLayer with empty `data` renders nothing)

  **Must NOT do**:
  - Do NOT add loading text/placeholder inside the map area
  - Do NOT change WorldMap's prop types
  - Do NOT modify the loading overlay logic in this task
  - Keep it to a one-line change in `map.tsx`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Literally a one-line change.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/pages/map.tsx:196-208` — The conditional render block to modify. Change `{displayedData && (` to always render, with `cities={displayedData ?? []}`.
  - `client/src/hooks/useMapLayers.ts:112` — Shows that ScatterplotLayer already handles empty `data` arrays gracefully (`data: temperatureCacheResult?.validCities || []`).

  **WHY Each Reference Matters**:
  - `map.tsx:196-208`: This is the exact code to change. The `displayedData &&` guard is unnecessary because all downstream consumers already handle empty/null data.
  - `useMapLayers.ts:112`: Proves layers won't crash with empty data arrays.

  **Acceptance Criteria**:

  - [ ] MapLibre basemap is visible immediately on page load (before any data arrives)
  - [ ] No white flash between page load and data arrival
  - [ ] WorldMap component always mounted in the DOM
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Map basemap visible on cold load
    Tool: Playwright (playwright skill)
    Preconditions: Clear browser cache / fresh incognito
    Steps:
      1. Navigate to http://localhost:3000?date=0315
      2. Take screenshot immediately (within 500ms of navigation)
      3. Assert MapLibre canvas element exists in DOM
      4. Assert no white/blank full-screen div visible
    Expected Result: Map basemap tiles visible even before weather data loads
    Failure Indicators: Blank white screen, or canvas element missing from DOM
    Evidence: .sisyphus/evidence/task-4-cold-load.png

  Scenario: Map persists when data is temporarily null
    Tool: Playwright (playwright skill)
    Steps:
      1. Load page, wait for data
      2. Change date via slider rapidly
      3. During transition, assert map canvas is still in DOM
    Expected Result: Canvas element never removed from DOM during data transitions
    Evidence: .sisyphus/evidence/task-4-persist-during-load.png
  ```

  **Commit**: YES
  - Message: `fix(map): always render map shell to prevent white flash on initial load`
  - Files: `client/src/pages/map.tsx`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 5. Optimize `useMapInteractions` handleHover callback stability

  **What to do**:
  - Modify `client/src/hooks/useMapInteractions.ts`
  - Problem: `handleHover` callback recreates every time `cities` changes (it's in the dependency array, line 117). Since `cities` changes on every data fetch, this causes frequent callback recreation → DeckGL sees a new `onHover` prop → potential unnecessary re-renders.
  - Solution: Store `cities` in a `useRef` and read from the ref inside the callback, removing `cities` from the `useCallback` dependency array.
  - Add: `const citiesRef = useRef(cities)` and keep it synced: `citiesRef.current = cities` (in the component body or a useEffect).
  - Update `handleHover` and `handleClick` to read from `citiesRef.current` instead of `cities` directly.
  - This stabilizes the callback identity — it won't change on every data fetch.

  **Must NOT do**:
  - Do NOT change the hover/click behavior — only stabilize the callback identity
  - Do NOT remove the throttle logic (it's correct and necessary)
  - Do NOT change the return type or API of the hook

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard React ref pattern for callback stability. Small, surgical change.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `client/src/hooks/useMapInteractions.ts:45-125` — The `handleHover` callback. Note the `cities` dependency on line 117. This is what to stabilize.
  - `client/src/hooks/useMapInteractions.ts:127-152` — The `handleClick` callback. Also depends on `cities` (line 151). Apply same ref pattern.

  **WHY Each Reference Matters**:
  - Lines 45-125: The full handleHover implementation. You need to understand how `cities` is used inside (line 89 for heatmap mode) to know it's safe to move to a ref.
  - Lines 127-152: handleClick also uses `cities` (line 139). Apply the same optimization.

  **Acceptance Criteria**:

  - [ ] `handleHover` callback identity is stable across data fetches (doesn't change when `cities` changes)
  - [ ] `handleClick` callback identity is stable across data fetches
  - [ ] Hover tooltips still work correctly in both marker and heatmap modes
  - [ ] Click to select city still works correctly
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Hover works after pan load
    Tool: Playwright (playwright skill)
    Preconditions: App loaded at localhost:3000?date=0715, marker view
    Steps:
      1. Wait for initial data load to complete
      2. Pan map slightly (drag 100px right)
      3. Wait for new data to arrive (dots update)
      4. Hover over a marker dot
      5. Assert tooltip appears with city name and temperature
    Expected Result: Tooltip displays correctly after data refresh
    Failure Indicators: No tooltip appears, or tooltip shows stale/wrong data
    Evidence: .sisyphus/evidence/task-5-hover-after-pan.png

  Scenario: Click works after pan load
    Tool: Playwright (playwright skill)
    Steps:
      1. After pan load completes, click on a marker dot
      2. Assert CityPopup appears with city details
    Expected Result: CityPopup opens with correct city data
    Failure Indicators: No popup, or popup shows wrong city
    Evidence: .sisyphus/evidence/task-5-click-after-pan.png
  ```

  **Commit**: YES
  - Message: `perf(map): stabilize handleHover/handleClick callback identity via refs`
  - Files: `client/src/hooks/useMapInteractions.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 6. Refactor WorldMap.tsx to use tiered loading system

  **What to do**:
  This is the CORE task — wiring everything together in WorldMap.tsx.
  
  - Import and use `useLoadingTier` hook (from Task 1)
  - Import and use `useBreatheAnimation` hook (from Task 2)
  - Replace the current monolithic loading effect (lines 181-226) with tier-aware logic:
    - **Tier 1 (date/dataType change, initial load)**: Keep existing behavior — show `<Loader>` overlay with backdrop blur, fade map to `MAP_LOADING_OPACITY`
    - **Tier 2 (pan/zoom)**: NO overlay. NO opacity fade on wrapper div. Map stays at full opacity. Pass `useBreatheAnimation`'s opacity to the layer rendering (via a new prop or context)
    - **Tier 'none' (not loading)**: Normal state, full opacity, no overlay, no animation
  - Remove the `dataHasChanged` computation from WorldMap (it's now in `useLoadingTier`)
  - Remove `prevDebouncedDateRef`, `prevMonthRef`, `prevDataTypeRef` from WorldMap (moved to hook)
  - Pass the breathe opacity down to `useMapLayers` — add a new prop `breatheOpacity?: number` that overrides the layer opacity during Tier 2
  - Modify `useMapLayers.ts` to accept and use `breatheOpacity`:
    - When `breatheOpacity` is provided and differs from normal opacity, use it as the layer's `opacity` prop
    - DeckGL's existing `transitions.opacity` (duration: 300ms) handles smooth interpolation automatically
    - Apply to BOTH ScatterplotLayer AND HeatmapLayer
  - Update the loading overlay `<Transition>` to only mount when `tier === 'tier1'` (not for tier2)
  - Update the map wrapper opacity: only apply `MAP_LOADING_OPACITY` when `tier === 'tier1'`

  **Must NOT do**:
  - Do NOT change the DeckGL controller config
  - Do NOT modify the CityPopup transition logic
  - Do NOT change MapTooltip rendering (handled in Task 3)
  - Do NOT add ghost dots here (that's Task 7)
  - Do NOT remove the `LOADER_DELAY_MS` delay for Tier 1 — it's still useful to avoid flash
  - Do NOT change how `isBasemapLoaded` works

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: This is the most complex task — refactoring the core loading state machine in WorldMap. Requires understanding the full component lifecycle and careful state management.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: The visual behavior (when to show overlay vs breathe) is a UX concern.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential dependency on Tasks 1, 2)
  - **Blocks**: Tasks 9, 11
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - `client/src/components/Map/WorldMap.tsx` — THE file being modified. Read the ENTIRE file. Key sections:
    - Lines 60-71: State declarations to simplify (remove prev*Ref, dataHasChanged)
    - Lines 87-88: `isLoading` derivation — this feeds into `useLoadingTier`
    - Lines 181-226: The loading effect to REPLACE with tier-aware logic
    - Lines 231-274: The JSX render — modify overlay condition and wrapper opacity
  - `client/src/hooks/useMapLayers.ts:77-201` — The layer creation. Needs `breatheOpacity` integration.
    - Line 129: `opacity: isLoadingWeather ? 0.5 : 0.8` — this becomes `opacity: breatheOpacity ?? (isLoadingWeather ? 0.5 : 0.8)`
    - Line 168: Same for sunshine markers
    - Lines 83-103: HeatmapLayer — add breathe opacity here too (on `opacity` prop, line 99)

  **API/Type References**:
  - `client/src/hooks/useLoadingTier.ts` (from Task 1) — The hook to import. Returns `{ tier, isDataChange, isPanLoad }`
  - `client/src/hooks/useBreatheAnimation.ts` (from Task 2) — The hook to import. Returns `{ opacity }`
  - `client/src/const.ts` — `MAP_LOADING_OPACITY`, `MAP_LOADED_OPACITY`, `LOADER_DELAY_MS`, `MAP_FADE_IN_DELAY_MS`

  **WHY Each Reference Matters**:
  - `WorldMap.tsx` entire file: You're surgically modifying the core component. Every line matters for understanding what to keep, what to move, and what to replace.
  - `useMapLayers.ts`: The layer opacity must be driven by the breathe hook during Tier 2. You need to add the `breatheOpacity` prop to the hook's interface and wire it to both ScatterplotLayer and HeatmapLayer.

  **Acceptance Criteria**:

  - [ ] Date change → full blocking overlay with Mantine Loader (same as before)
  - [ ] DataType toggle → full blocking overlay (same as before)
  - [ ] Pan/zoom → NO overlay, NO wrapper opacity fade. Map stays interactive.
  - [ ] Pan/zoom → markers/heatmap opacity gently cycles 0.5↔0.8 with smooth DeckGL transition
  - [ ] Tier 2 loading >3 seconds → escalates to full blocking overlay
  - [ ] During Tier 2, user can hover markers and see tooltips
  - [ ] During Tier 2, user can click markers and open CityPopup
  - [ ] `prevDebouncedDateRef`, `prevMonthRef`, `prevDataTypeRef` removed from WorldMap
  - [ ] `useMapLayers` accepts and uses `breatheOpacity` parameter
  - [ ] HeatmapLayer also breathes during Tier 2
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Pan does NOT show blocking overlay
    Tool: Playwright (playwright skill)
    Preconditions: App loaded at localhost:3000?date=0715, marker view, zoomed in (zoom >= 3)
    Steps:
      1. Wait for initial data load complete (no overlay visible)
      2. Pan map by dragging 300px to the right
      3. During the 200ms debounce + data fetch, take rapid screenshots (every 200ms for 2 seconds)
      4. Assert: in NONE of the screenshots is the blocking overlay (.absolute.inset-0.bg-background\/70.backdrop-blur-sm) visible
      5. Assert: marker dots are visible in every screenshot
    Expected Result: No blocking overlay appears during pan. Dots remain visible throughout.
    Failure Indicators: Blocking overlay appears at any point, or dots disappear
    Evidence: .sisyphus/evidence/task-6-pan-no-overlay-{1-10}.png

  Scenario: Date change DOES show blocking overlay
    Tool: Playwright (playwright skill)
    Steps:
      1. With map loaded, change date slider from current position to a significantly different date
      2. Assert blocking overlay appears (the .absolute.inset-0 element with Loader inside)
      3. Wait for data to load
      4. Assert overlay disappears
    Expected Result: Full blocking overlay appears during date change, disappears when done
    Evidence: .sisyphus/evidence/task-6-date-change-overlay.png

  Scenario: Markers are clickable during pan load
    Tool: Playwright (playwright skill)
    Steps:
      1. Zoom in, pan map to trigger Tier 2 load
      2. While data is loading (breathe animation active), click on a visible marker dot
      3. Assert CityPopup opens
    Expected Result: CityPopup opens successfully during Tier 2 load
    Failure Indicators: Click doesn't register, or popup doesn't open
    Evidence: .sisyphus/evidence/task-6-click-during-pan-load.png
  ```

  **Commit**: YES
  - Message: `feat(map): implement tiered loading — non-blocking pan/zoom with breathe animation`
  - Files: `client/src/components/Map/WorldMap.tsx`, `client/src/hooks/useMapLayers.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 7. Create `useGhostDots` hook + integrate into useMapLayers

  **What to do**:
  - Create a new hook `client/src/hooks/useGhostDots.ts`
  - The hook generates translucent "placeholder" dots in areas of the viewport that have no real data dots yet
  - Inputs: `realCities: WeatherDataUnion[]` (current visible dots), `viewState: MapViewState` (current viewport), `isActive: boolean` (only true during Tier 2 loads), `dataType: DataType`
  - Algorithm:
    1. When `isActive` becomes true, compute the current viewport bounds from `viewState` (reuse `WebMercatorViewport` from `useMapBounds.ts`)
    2. Create a grid of candidate positions across the viewport (e.g., every 2° lat/long)
    3. Filter out positions that are within ~1° of any real city dot (avoid overlapping)
    4. Return remaining positions as ghost dot data (max 40-50 ghost dots)
    5. Each ghost dot has: `lat`, `long`, and a computed color based on nearest real dot (or a neutral gray)
  - When `isActive` becomes false, return empty array (ghost dots disappear)
  - Ghost dots should have a VERY low opacity (0.15-0.2) and be non-pickable (no hover/click)
  - Integrate into `useMapLayers.ts`:
    - Add a new `ScatterplotLayer` for ghost dots with `id: 'ghost-markers'`
    - Set `pickable: false`, `opacity: 0.15`
    - Add `transitions.opacity` with duration 200ms for fade-in/out
    - Place BEHIND real marker layer (render first in layers array)
    - Add a `HeatmapLayer` variant for ghost dots when in heatmap mode (lower weight, lower opacity)
  - Add constants to `client/src/const.ts`: `GHOST_DOT_OPACITY = 0.15`, `GHOST_DOT_MAX_COUNT = 50`, `GHOST_DOT_GRID_SPACING_DEG = 2`, `GHOST_DOT_EXCLUSION_RADIUS_DEG = 1`

  **Must NOT do**:
  - Do NOT make ghost dots pickable (no hover tooltips, no click)
  - Do NOT show ghost dots during Tier 1 loads
  - Do NOT use a complex clustering/density algorithm — simple grid + exclusion is sufficient
  - Do NOT persist ghost dots after real data arrives (they must disappear)
  - Do NOT create more than 50 ghost dots (performance budget)
  - Do NOT use `requestAnimationFrame` for ghost dot animation — DeckGL transitions handle fade

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Geo-spatial grid generation + exclusion radius + integration into existing layer system. Requires understanding of map projections and DeckGL layer ordering.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ghost dots are a visual design choice — color, opacity, size need to feel right.

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Task 6 and Task 8 in Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 6, 8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (needs `useLoadingTier` to know when Tier 2 is active)

  **References**:

  **Pattern References**:
  - `client/src/hooks/useMapBounds.ts:22-56` — The `calculateBounds()` function and `WebMercatorViewport` usage. Reuse this pattern to compute viewport bounds for ghost dot grid.
  - `client/src/hooks/useMapLayers.ts:82-104` — HeatmapLayer creation pattern. Follow this for ghost heatmap layer.
  - `client/src/hooks/useMapLayers.ts:109-147` — ScatterplotLayer creation pattern. Follow this for ghost marker layer.
  - `client/src/hooks/useColorCache.ts` — Color computation pattern. Ghost dots should use a neutral color (e.g., `TEMPERATURE_LOADING_COLOR` or `SUNSHINE_LOADING_COLOR` from `const.ts` lines 141-146).

  **API/Type References**:
  - `@deck.gl/core` — `WebMercatorViewport`, `MapViewState` types
  - `client/src/const.ts:141-146` — `TEMPERATURE_LOADING_COLOR`, `SUNSHINE_LOADING_COLOR` — use these as ghost dot colors

  **WHY Each Reference Matters**:
  - `useMapBounds.ts:22-56`: You need to compute viewport bounds to know WHERE to place ghost dots. This function already does that.
  - `useMapLayers.ts:109-147`: You need to add ghost dot layers that match the existing layer structure (same radius config, same transition pattern, just lower opacity and non-pickable).

  **Acceptance Criteria**:

  - [ ] New file exists: `client/src/hooks/useGhostDots.ts`
  - [ ] Ghost dots appear in empty viewport areas during Tier 2 (pan) loads
  - [ ] Ghost dots do NOT appear during Tier 1 (date change) loads
  - [ ] Ghost dots fade out (≤200ms) when real data arrives
  - [ ] Ghost dots are NOT pickable (no hover tooltips, no click interaction)
  - [ ] Ghost dots have low opacity (~0.15)
  - [ ] Maximum 50 ghost dots at any time
  - [ ] Ghost dots don't overlap with real city dots (≥1° exclusion radius)
  - [ ] Ghost dot layer renders BEHIND real marker layer
  - [ ] Constants added to `client/src/const.ts`
  - [ ] Works in both marker and heatmap view modes
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Ghost dots appear during pan load
    Tool: Playwright (playwright skill)
    Preconditions: App loaded at localhost:3000?date=0715, marker view, zoomed to ~3
    Steps:
      1. Wait for initial data load
      2. Pan map significantly to the right (drag 400px)
      3. During data loading phase, take screenshot
      4. Count translucent dots in areas where no bright-colored marker dots exist
    Expected Result: Faint dots visible in viewport areas without real data
    Failure Indicators: No ghost dots visible, or ghost dots overlap with real markers
    Evidence: .sisyphus/evidence/task-7-ghost-dots-during-pan.png

  Scenario: Ghost dots disappear after data loads
    Tool: Playwright (playwright skill)
    Steps:
      1. Pan map to trigger ghost dots
      2. Wait for data to fully load (loading state ends)
      3. Take screenshot
      4. Assert no translucent/ghost dots remain — only real colored markers
    Expected Result: Ghost dots fade out completely after real data arrives
    Evidence: .sisyphus/evidence/task-7-ghost-dots-gone-after-load.png

  Scenario: Ghost dots do NOT appear on date change
    Tool: Playwright (playwright skill)
    Steps:
      1. Change date slider to a different date
      2. During loading overlay, inspect DOM for ghost-markers layer
      3. Assert ghost-markers layer has empty data or is not visible
    Expected Result: No ghost dots during date change — only blocking overlay
    Evidence: .sisyphus/evidence/task-7-no-ghost-on-date-change.png
  ```

  **Commit**: YES
  - Message: `feat(map): add ghost dots as placeholder feedback during pan/zoom loads`
  - Files: `client/src/hooks/useGhostDots.ts`, `client/src/hooks/useMapLayers.ts`, `client/src/const.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 8. Fix double-opacity issue in useMapLayers

  **What to do**:
  - Modify `client/src/hooks/useMapLayers.ts`
  - Currently line 129: `opacity: isLoadingWeather ? 0.5 : 0.8` — this reduces marker opacity during ANY loading
  - With the tiered system from Task 6, `breatheOpacity` already handles Tier 2 opacity cycling
  - Remove the `isLoadingWeather` ternary from opacity. Replace with: `opacity: breatheOpacity ?? 0.8`
  - This means:
    - During Tier 1: WorldMap wrapper fades to 0.3 (the overlay handles visual feedback), markers stay at 0.8 (no double dimming)
    - During Tier 2: `breatheOpacity` cycles 0.5↔0.8 (no wrapper fade, just marker breathe)
    - Not loading: markers at 0.8
  - Apply the same fix to both temperature markers (line 129) and sunshine markers (line 168)
  - Remove `isLoadingWeather` from the `useMapLayers` props interface entirely — it's no longer needed by the layer creation (breatheOpacity replaces it)
  - Update the `useMemo` dependency array to remove `isLoadingWeather` and add `breatheOpacity` (if not already done in Task 6)

  **Must NOT do**:
  - Do NOT change the DeckGL transitions config (those are correct)
  - Do NOT modify the HeatmapLayer opacity handling (that's separate, handled via breatheOpacity in Task 6)
  - Do NOT remove the `isLoadingWeather` prop from WorldMap itself (other logic may still need it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small surgical change — remove one ternary, replace with prop. Two lines per layer.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Task 6 completing first (Task 6 adds `breatheOpacity` prop to `useMapLayers`, Task 8 uses it)
  - **Parallel Group**: Wave 2, but AFTER Task 6 completes (or merge into Task 6 if executor prefers — both modify `useMapLayers.ts`)
  - **Blocks**: Task 11
  - **Blocked By**: Task 6 (needs `breatheOpacity` prop added to useMapLayers interface first)

  **References**:

  **Pattern References**:
  - `client/src/hooks/useMapLayers.ts:129` — `opacity: isLoadingWeather ? 0.5 : 0.8` — THE line to change for temperature markers
  - `client/src/hooks/useMapLayers.ts:168` — Same line for sunshine markers
  - `client/src/hooks/useMapLayers.ts:36-42` — The `UseMapLayersProps` interface — remove `isLoadingWeather`, add `breatheOpacity`
  - `client/src/hooks/useMapLayers.ts:192-200` — The `useMemo` dependency array — update accordingly

  **WHY Each Reference Matters**:
  - Lines 129 and 168: These are the exact two lines causing double opacity. Both need the same fix.
  - Lines 36-42: The interface change propagates to WorldMap.tsx which calls this hook.

  **Acceptance Criteria**:

  - [ ] `isLoadingWeather` removed from `useMapLayers` props interface
  - [ ] Marker opacity during Tier 1 loading: 0.8 (no more double dimming — wrapper handles visual feedback)
  - [ ] Marker opacity during Tier 2 loading: cycles 0.5↔0.8 via `breatheOpacity`
  - [ ] Marker opacity when not loading: 0.8
  - [ ] `npx vitest run` — all existing tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: No double opacity during date change
    Tool: Playwright (playwright skill)
    Preconditions: App loaded, marker view
    Steps:
      1. Change date via slider
      2. During loading overlay, inspect marker dots opacity
      3. Markers should be at 0.8 opacity (only the wrapper div fades, not the markers individually)
    Expected Result: Markers at 0.8 opacity. Wrapper div at MAP_LOADING_OPACITY (0.3). Effective visible opacity ~0.24 (not 0.15 like before).
    Failure Indicators: Markers at 0.5 opacity (old double-dim behavior)
    Evidence: .sisyphus/evidence/task-8-no-double-opacity.png
  ```

  **Commit**: YES (group with Task 6)
  - Message: `fix(map): remove double-opacity dimming during loading`
  - Files: `client/src/hooks/useMapLayers.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 9. Unit tests for `useLoadingTier` and `useBreatheAnimation`

  **What to do**:
  - Create test file: `client/src/tests/hooks/useLoadingTier.test.ts`
  - Create test file: `client/src/tests/hooks/useBreatheAnimation.test.ts`
  - For `useLoadingTier`, test:
    - Returns `'none'` when not loading
    - Returns `'tier1'` when loading + date changed
    - Returns `'tier1'` when loading + month changed
    - Returns `'tier1'` when loading + dataType changed
    - Returns `'tier1'` when basemap not loaded
    - Returns `'tier2'` when loading + no data params changed (pan/zoom)
    - Escalates from `'tier2'` to `'tier1'` after 3000ms (use `vi.useFakeTimers()`)
    - Tier 1 takes precedence: if date changes while pan load is active, tier becomes 'tier1'
    - Returns `'none'` when loading stops
    - Prev refs update correctly on load completion
  - For `useBreatheAnimation`, test:
    - Returns max opacity when inactive
    - Cycles between min and max when active
    - Returns to max opacity when deactivated
    - Cleans up timers on unmount
  - Use `@testing-library/react` `renderHook` for testing hooks
  - Follow existing test patterns in `client/src/tests/`

  **Must NOT do**:
  - Do NOT test visual rendering (that's QA scenarios in Task 11)
  - Do NOT mock DeckGL internals
  - Do NOT create integration tests in this task (that's Task 11)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test scenarios with timer mocking, edge cases. Needs thorough coverage.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10, 11 in Wave 3)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 1, 2, 6

  **References**:

  **Pattern References**:
  - `client/src/tests/stores/useWeatherStore.test.ts` — Existing test pattern for stores/hooks. Follow the describe/it structure and assertion style.
  - `client/src/tests/utils/dateFormatting/getTodayAsMMDD.test.ts` — Example of simple unit test structure.

  **Test References**:
  - `@testing-library/react` — `renderHook`, `act` for testing hooks
  - `vitest` — `vi.useFakeTimers()`, `vi.advanceTimersByTime()` for timer testing

  **Acceptance Criteria**:

  - [ ] Test files created at expected paths
  - [ ] ≥10 test cases for `useLoadingTier`
  - [ ] ≥4 test cases for `useBreatheAnimation`
  - [ ] All tests pass: `cd client && npx vitest run src/tests/hooks/useLoadingTier.test.ts`
  - [ ] All tests pass: `cd client && npx vitest run src/tests/hooks/useBreatheAnimation.test.ts`
  - [ ] Full test suite still passes: `cd client && npx vitest run`

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All useLoadingTier tests pass
    Tool: Bash (vitest)
    Steps:
      1. Run: cd client && npx vitest run src/tests/hooks/useLoadingTier.test.ts
      2. Assert: 0 failures
    Expected Result: All tests pass (≥10 tests, 0 failures)
    Evidence: .sisyphus/evidence/task-9-loading-tier-tests.txt

  Scenario: All useBreatheAnimation tests pass
    Tool: Bash (vitest)
    Steps:
      1. Run: cd client && npx vitest run src/tests/hooks/useBreatheAnimation.test.ts
      2. Assert: 0 failures
    Expected Result: All tests pass (≥4 tests, 0 failures)
    Evidence: .sisyphus/evidence/task-9-breathe-tests.txt
  ```

  **Commit**: YES
  - Message: `test(map): add unit tests for loading tier detection and breathe animation`
  - Files: `client/src/tests/hooks/useLoadingTier.test.ts`, `client/src/tests/hooks/useBreatheAnimation.test.ts`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 10. Unit tests for MapTooltip repositioning

  **What to do**:
  - Create test file: `client/src/tests/components/MapTooltip.test.tsx`
  - Test the viewport-aware repositioning logic:
    - Tooltip near center of viewport → positioned at x+10, y+10 (default)
    - Tooltip near right edge → flips to left side of cursor
    - Tooltip near bottom edge → flips to above cursor
    - Tooltip near bottom-right corner → flips to top-left of cursor
  - Mock `window.innerWidth` and `window.innerHeight` for edge testing
  - Use `@testing-library/react` render + `getBoundingClientRect` assertions

  **Must NOT do**:
  - Do NOT test tooltip content (that's outside scope)
  - Do NOT create Playwright tests here (that's Task 11)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small test file, straightforward DOM assertions.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 11 in Wave 3)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `client/src/components/Map/MapTooltip.tsx` — The component being tested (after Task 3 modifications)
  - `client/src/tests/` — Existing test structure to follow

  **Acceptance Criteria**:

  - [ ] Test file created: `client/src/tests/components/MapTooltip.test.tsx`
  - [ ] ≥4 test cases covering all edge positions
  - [ ] All tests pass: `cd client && npx vitest run src/tests/components/MapTooltip.test.tsx`

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: MapTooltip tests pass
    Tool: Bash (vitest)
    Steps:
      1. Run: cd client && npx vitest run src/tests/components/MapTooltip.test.tsx
      2. Assert: 0 failures
    Expected Result: All tests pass (≥4 tests, 0 failures)
    Evidence: .sisyphus/evidence/task-10-tooltip-tests.txt
  ```

  **Commit**: YES
  - Message: `test(map): add unit tests for MapTooltip viewport-aware positioning`
  - Files: `client/src/tests/components/MapTooltip.test.tsx`
  - Pre-commit: `cd client && npx vitest run`

---

- [ ] 11. Integration QA — Full Playwright verification of all changes

  **What to do**:
  - Run comprehensive Playwright-based QA across ALL changes from this plan
  - Start the dev server: `cd client && npm run dev` (or use the Makefile)
  - Verify each feature visually in the browser:
    1. **Tiered loading**: Pan map → no overlay. Change date → overlay appears.
    2. **Breathe animation**: Pan while zoomed in → observe marker opacity cycling
    3. **Ghost dots**: Pan to new area → faint dots in empty zones → disappear when data loads
    4. **Tooltip**: Hover markers near edges → tooltip doesn't clip
    5. **Map shell**: Cold load → basemap visible immediately
    6. **Interactions during pan load**: Click/hover markers during Tier 2 → works normally
    7. **Escalation**: Simulate slow network → after 3s Tier 2 escalates to Tier 1
    8. **Heatmap mode**: Repeat tiered loading tests in heatmap view
  - Capture screenshots as evidence for each scenario
  - Run full test suite: `cd client && npx vitest run`
  - Run type check: `cd client && npx tsc --noEmit`

  **Must NOT do**:
  - Do NOT modify any code in this task — only verify and capture evidence
  - Do NOT skip any scenario — all must have evidence

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive QA across multiple features, requires browser automation.
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for visual verification.

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all implementation tasks being complete)
  - **Parallel Group**: Wave 3 (can run parallel with Tasks 9, 10 since those are unit tests)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 6, 7, 8

  **References**:
  - All modified files from Tasks 1-8
  - Dev server: `make dev` or `cd client && npm run dev`

  **Acceptance Criteria**:

  - [ ] All 8 scenarios verified with screenshots
  - [ ] `cd client && npx vitest run` → 0 failures
  - [ ] `cd client && npx tsc --noEmit` → 0 errors
  - [ ] No console errors in browser during QA

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tier 2 — pan does not show overlay
    Tool: Playwright (playwright skill)
    Preconditions: App at localhost:3000?date=0715
    Steps:
      1. Wait for map to fully load
      2. Zoom in to level 3+
      3. Drag map 300px right
      4. Take screenshots every 200ms for 3 seconds
      5. Assert: no element matching .backdrop-blur-sm is visible in any screenshot
      6. Assert: marker dots are visible in all screenshots
    Expected Result: Smooth pan with no blocking overlay
    Evidence: .sisyphus/evidence/task-11-tier2-pan-sequence/*.png

  Scenario: Tier 1 — date change shows overlay
    Tool: Playwright (playwright skill)
    Steps:
      1. Move date slider from July to January (large jump)
      2. Assert overlay appears
      3. Wait for data load
      4. Assert overlay disappears
    Expected Result: Blocking overlay during date change
    Evidence: .sisyphus/evidence/task-11-tier1-date-change.png

  Scenario: Ghost dots appear and disappear
    Tool: Playwright (playwright skill)
    Steps:
      1. Zoom in, then pan significantly
      2. During load, screenshot (should show faint dots in empty areas)
      3. After load, screenshot (faint dots should be gone)
    Expected Result: Ghost dots visible during load only
    Evidence: .sisyphus/evidence/task-11-ghost-dots-lifecycle.png

  Scenario: Tooltip at right edge
    Tool: Playwright (playwright skill)
    Steps:
      1. Hover marker near right viewport edge
      2. Screenshot
      3. Assert tooltip right edge <= viewport width
    Expected Result: Tooltip flips to left, doesn't clip
    Evidence: .sisyphus/evidence/task-11-tooltip-edge.png

  Scenario: Cold load shows basemap
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to app in incognito/fresh session
      2. Screenshot within 500ms
      3. Assert map canvas visible (not blank white)
    Expected Result: Basemap tiles visible before data loads
    Evidence: .sisyphus/evidence/task-11-cold-load-basemap.png

  Scenario: Click during Tier 2 load
    Tool: Playwright (playwright skill)
    Steps:
      1. Pan map to trigger Tier 2
      2. Click visible marker during load
      3. Assert CityPopup appears
    Expected Result: Interaction works during pan load
    Evidence: .sisyphus/evidence/task-11-click-during-tier2.png

  Scenario: Heatmap mode tiered loading
    Tool: Playwright (playwright skill)
    Steps:
      1. Switch to heatmap view
      2. Pan map
      3. Assert no blocking overlay
      4. Change date
      5. Assert blocking overlay appears
    Expected Result: Tiered loading works in heatmap mode too
    Evidence: .sisyphus/evidence/task-11-heatmap-tiered.png

  Scenario: Full test suite passes
    Tool: Bash
    Steps:
      1. Run: cd client && npx vitest run
      2. Run: cd client && npx tsc --noEmit
    Expected Result: 0 failures, 0 type errors
    Evidence: .sisyphus/evidence/task-11-test-suite.txt
  ```

  **Commit**: NO (QA only, no code changes)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (tiered loading + ghost dots + tooltip fix working together). Test edge cases: rapid pan-then-date-change, zoom in-out rapidly, switch marker↔heatmap during load. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance per task. Detect cross-task contamination: Task N touching Task M's files unexpectedly. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(map): add useLoadingTier hook for context-aware loading detection` | `useLoadingTier.ts`, `const.ts` | `npx vitest run` |
| 2 | `feat(map): add useBreatheAnimation hook for subtle loading feedback` | `useBreatheAnimation.ts`, `const.ts` | `npx vitest run` |
| 3 | `fix(map): prevent tooltip from clipping off viewport edges` | `MapTooltip.tsx` | `npx vitest run` |
| 4 | `fix(map): always render map shell to prevent white flash on initial load` | `map.tsx` | `npx vitest run` |
| 5 | `perf(map): stabilize handleHover/handleClick callback identity via refs` | `useMapInteractions.ts` | `npx vitest run` |
| 6 | `feat(map): implement tiered loading — non-blocking pan/zoom with breathe animation` | `WorldMap.tsx`, `useMapLayers.ts` | `npx vitest run` |
| 7 | `feat(map): add ghost dots as placeholder feedback during pan/zoom loads` | `useGhostDots.ts`, `useMapLayers.ts`, `const.ts` | `npx vitest run` |
| 8 | `fix(map): remove double-opacity dimming during loading` | `useMapLayers.ts` | `npx vitest run` |
| 9 | `test(map): add unit tests for loading tier detection and breathe animation` | `useLoadingTier.test.ts`, `useBreatheAnimation.test.ts` | `npx vitest run` |
| 10 | `test(map): add unit tests for MapTooltip viewport-aware positioning` | `MapTooltip.test.tsx` | `npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
cd client && npx vitest run          # Expected: 0 failures
cd client && npx tsc --noEmit        # Expected: 0 errors
```

### Final Checklist
- [ ] Pan/zoom never shows blocking overlay
- [ ] Date/dataType changes show blocking overlay
- [ ] Markers breathe (opacity pulse) during pan loads
- [ ] Ghost dots appear in empty viewport zones during pan loads
- [ ] Ghost dots disappear when data arrives
- [ ] Tier 2 escalates to Tier 1 after 3 seconds
- [ ] Tooltip never clips off viewport edges
- [ ] Map basemap always visible (no white flash)
- [ ] handleHover callback identity stable
- [ ] No double-opacity dimming
- [ ] All unit tests pass
- [ ] All existing tests still pass
- [ ] TypeScript compilation clean
