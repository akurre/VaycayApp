# Constants and Types Organization

## Intent
Maintain a clean, organized codebase by ensuring all constants and type definitions are properly centralized in their designated files.

## Scope
- Applies to all TypeScript/JavaScript code in the client and server directories
- Includes constants, enums, type definitions, and interfaces

## Requirements

### Constants Must Live in Constants Files
- **ALL** constants must be defined in the appropriate constants file:
  - Client-side: `client/src/constants.ts`
  - Server-side: `server/src/const.ts`
- **NEVER** define constants inline in component files, utility files, or other modules
- Constants include:
  - Configuration values (URLs, API endpoints, thresholds)
  - Magic numbers that appear in multiple places
  - Fixed data structures (color mappings, style configurations)
  - Default values used across the application

**Incorrect:**
```typescript
// in WorldMap.tsx
const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};
```

**Correct:**
```typescript
// in constants.ts
export const MAP_STYLES = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const;

// in WorldMap.tsx
import { MAP_STYLES } from '@/constants';
```

### Use Enums for Fixed Sets of Values
- **ALWAYS** use enums for any fixed set of string or number values
- Enums must be defined in appropriate type files within `client/src/types/` or `server/src/types/`
- **NEVER** use string literal unions when an enum would be more appropriate
- Enums provide better type safety and refactoring support

**Incorrect:**
```typescript
type MapTheme = 'light' | 'dark';
type ViewMode = 'heatmap' | 'markers';
```

**Correct:**
```typescript
// in client/src/types/mapTypes.ts
export enum MapTheme {
  Light = 'light',
  Dark = 'dark',
}

export enum ViewMode {
  Heatmap = 'heatmap',
  Markers = 'markers',
}
```

### Type Definitions Organization
- All type-only declarations (interfaces, types, enums) must be in `client/src/types/` or `server/src/types/`
- **Exception:** Component props interfaces should be defined in the same file as the component
- Group related types in the same file (e.g., all map-related types in `mapTypes.ts`)
- Use descriptive file names that indicate the domain (e.g., `cityWeatherDataType.ts`, `mapTypes.ts`)

### Use Theme Colors from appColors
- **NEVER** use hardcoded color strings like `'gray'`, `'#ffffff'`, etc.
- **ALWAYS** reference colors from `appColors` in `client/src/theme.ts`
- This ensures consistent theming across the application

**Incorrect:**
```typescript
<IconSun size={16} color="gray" />
```

**Correct:**
```typescript
import { appColors } from '@/theme';
<IconSun size={16} color={appColors.dark.textSecondary} />
```

## Benefits
- **Single Source of Truth**: Constants and types are defined once and imported everywhere
- **Easy Refactoring**: Changing a constant or enum value updates all usages automatically
- **Better Type Safety**: Enums provide compile-time checking and IDE autocomplete
- **Maintainability**: Easy to find and update constants and types
- **Consistency**: Prevents duplicate definitions and magic values scattered throughout code

## Workflow

When creating new code:
1. **Before defining any constant**: Check if it should go in `constants.ts` or `const.ts`
2. **Before using string literals**: Consider if an enum would be more appropriate
3. **Before defining types**: Determine if they belong in a types file or with the component
4. **Before using colors**: Check if the color exists in `appColors`

When reviewing code:
1. Look for inline constants that should be extracted
2. Look for string literal unions that should be enums
3. Look for hardcoded colors that should use `appColors`
4. Look for type definitions that should be in types files

## Examples

### Good: Centralized Constants
```typescript
// constants.ts
export const API_BASE_URL = 'https://api.example.com';
export const MAX_RETRY_ATTEMPTS = 3;
export const DEBOUNCE_DELAY = 200;

// component.tsx
import { API_BASE_URL, MAX_RETRY_ATTEMPTS } from '@/constants';
```

### Good: Using Enums
```typescript
// types/statusTypes.ts
export enum LoadingStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

// component.tsx
import { LoadingStatus } from '@/types/statusTypes';
const [status, setStatus] = useState(LoadingStatus.Idle);
```

### Good: Using Theme Colors
```typescript
// component.tsx
import { appColors } from '@/theme';

<Button
  style={{
    backgroundColor: appColors.primary,
    color: appColors.light.text,
  }}
/>
```

## Cline Guidance
- When you see inline constants, extract them to the constants file
- When you see string literal unions, convert them to enums
- When you see hardcoded colors, replace with `appColors` references
- When creating new constants or types, immediately place them in the correct file
- Do not wait for user feedback to organize constants and types properly

## Related Rules
- See `.clinerules/05-proper-typescript-typing.md` for general typing guidelines
- See `.clinerules/04-test-driven-development.md` for testing type definitions
