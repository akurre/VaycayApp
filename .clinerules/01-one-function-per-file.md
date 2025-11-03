# One Function Per File

## Intent
Maintain high cohesion and easy discoverability by ensuring each top-level function lives in its own file.

## Scope
- Applies to all TypeScript/JavaScript in this repo (client and server).
- A “function” includes:
  - `function foo() {}`
  - `const foo = () => {}`
  - `export function foo() {}`
  - `export const foo = () => {}`
- React components already follow “one component per file” and are aligned with this rule.

## Requirements
- Each top-level function must have its own file, named after the function:
  - `function doThing` -> `doThing.ts`
  - `export function hasCoords` -> `hasCoords.ts`
- Utility functions should live in the nearest relevant `utils/` folder.
  - Example: Map-specific utilities go in `client/src/components/Map/utils/`.
- Do not define multiple exported functions in the same file.
- **Type Declarations:**
  - All type-only declarations (interfaces, types) must be placed in appropriate files within `client/src/types/` or `server/src/types/`.
  - **Exception:** Component props interfaces should be defined in the same file as the component they belong to.
  - Do NOT co-locate types with functions, hooks, or utilities - always extract them to the types directory.
  - Group related types in the same file (e.g., all weather-related types in `cityWeatherDataType.ts`).
- If a file contains a React component, do not add additional exported helpers; extract them to a separate file and import them.

## Exceptions
- File-scoped non-exported helpers inside a React component file are discouraged. If needed for performance or closure semantics, keep them private (non-exported) and extremely small. Prefer extraction when feasible.
- Index files that only re-export symbols are allowed.

## Naming & Location
- Use PascalCase for React components (`WorldMap.tsx`), `useX.ts` for hooks, and camelCase for small utilities (`hasCoords.ts`).
- Co-locate domain utilities:
  - Map utilities: `client/src/components/Map/utils/`
  - Cross-cutting utilities: `client/src/utils/`
  - Server utilities: `server/src/utils/`

## Example (Applied)
- Extract `markerIcon` and `hasCoords` from `WorldMap.tsx` into:
  - `client/src/components/Map/utils/markerIcon.ts`
  - `client/src/components/Map/utils/hasCoords.ts`

## Review Signals
- If you see multiple function declarations or multiple exported functions in one file, extract them.
- Avoid mixing UI components with utilities. Components import utilities; utilities never import components.

## Cline Guidance
- When creating new helpers, generate a new file per function following this rule.
- Prefer importing existing utilities rather than inlining helpers within components.
