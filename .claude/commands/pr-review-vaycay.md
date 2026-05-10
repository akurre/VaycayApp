---
description: Review current changes against Vaycay project standards
---

Review the current git changes (or specified files) against Vaycay's conventions in `CLAUDE.md` (already in your context — apply the rules, don't restate them).

**Default scope:** files modified vs `origin/master` on the current branch. If file paths are passed as arguments, review those instead.

## Step 0 — Confirm Serena project is active

If `mcp__serena__*` tools are listed as available, run `mcp__serena__check_onboarding_performed` once. If onboarding hasn't been done for this project, call `mcp__serena__activate_project` with `project="/Users/ashlenkurre/Documents/GitHub/VaycayApp"` (or the current working tree) so symbol lookups resolve correctly.

If Serena tools aren't listed, skip this step — the model will fall back to ripgrep automatically. Tell the user at the end so they know to restart their Claude client to pick up the MCP.

## Step 1 — Triage (single batched tool call)

Fire all of these in parallel before reading any source files:

- `git diff --stat origin/master...HEAD` — scope (files + line counts)
- `git diff --name-only origin/master...HEAD` — file list
- `git diff origin/master...HEAD` — the actual diff
- `cd "$(git rev-parse --show-toplevel)/client" && npm run lint -- --quiet 2>&1 | tail -50` (only if `client/` files changed)
- `cd "$(git rev-parse --show-toplevel)/client" && npm run type-check 2>&1 | tail -50` (only if `client/` files changed)
- `cd "$(git rev-parse --show-toplevel)/server" && npm run lint -- --quiet 2>&1 | tail -50` (only if `server/` files changed)
- `cd "$(git rev-parse --show-toplevel)/server" && npm run type-check 2>&1 | tail -50` (only if `server/` files changed)
- `cd "$(git rev-parse --show-toplevel)" && npm run knip 2>&1 | tail -50` (root — unused exports, dead code; knip script lives at repo root, NOT in client/ or server/)

Note: Bash tool CWD persists across parallel tool calls. Always use absolute paths via `$(git rev-parse --show-toplevel)` so a concurrent `cd client` in one call doesn't leave the CWD wrong for another.

Use lint + tsc + knip findings as a free first pass. Don't re-flag what they already caught — surface them in a "Static analysis" section of your report and move on.

## Step 2 — Scope filter

From `git diff --stat`, decide which categories apply. Skip the rest entirely.

| Category | Skip when |
|---|---|
| §10 DB queries | no `*.sql` / `prisma/` changes |
| §11 GraphQL | no `*.gql` / `queries.ts` / `resolvers/` changes |
| §12 Tests | no `*.test.*` and no new util/hook/component |
| §7 Mantine + colors | no `client/src/components/` or `client/src/**/*.tsx` changes |
| §8 React patterns | no `client/` `.tsx` changes |
| §13 Server DB rules | no `server/` changes |

Announce skipped categories in the final summary.

## Step 3 — Read strategy

Default to **diff-first**. Read whole files only when the changed lines lack the surrounding context to judge (imports, dep arrays, callers, type definitions).

**Tool preference order for sweeps:**

1. **Serena MCP** — preferred for anything symbol-aware. Tool names:
   - `mcp__serena__get_symbols_overview` — outline a file's top-level symbols. **Use first on every changed file** to verify single-export rule (§1) and spot the export shape.
   - `mcp__serena__find_symbol` — does this constant / type guard / utility already exist? Usage:
     - `find_symbol(name_path="hasCoords")` before flagging a duplicate type guard.
     - `find_symbol(name_path="MAP_STYLES", relative_path="client/src/constants.ts")` to verify a constant lives where CLAUDE.md requires.
   - `mcp__serena__find_referencing_symbols` — blast-radius check before suggesting a rename / extraction.
   - `mcp__serena__search_for_pattern` — code-aware search; faster than rg when the match needs surrounding semantic context (e.g. "find every component that destructures a Zustand store").

   If Serena is not in the available tool list, fall back to ripgrep below. (Serena requires a restart of the Claude client after install — tell the user if it's missing.)

2. **ripgrep** — fast literal / regex sweeps when you don't need symbol semantics. Examples:
   - Mantine layout: `rg -n '<(Group|Stack|Container|Grid|Flex|Center|Box|Space)\b' client/src`
   - Hex colors: `rg -n '#[0-9a-fA-F]{3,8}\b' client/src`
   - `key={index}`: `rg -n 'key=\{(?:i|index|idx)\}' client/src`
   - Zustand destructuring: `rg -n 'const \{[^}]+\} = use[A-Z][a-zA-Z]*Store' client/src`
   - `?? 0` near coords: `rg -n '\?\? 0' client/src/components/Map`

3. **Read** whole file — last resort, when surrounding context is needed and neither Serena nor rg can answer.

**Batch independent reads in a single tool-use block.** Models default to serial; do not.

**Subagent dispatch (conditional):**
- If the diff exceeds **10 files OR 1500 changed lines**, split the checklist across 2-3 parallel `Explore` subagents (suggested split: structure+state+types | mantine+react+a11y | perf+graphql+tests+security) and synthesize their summaries.
- If a single duplication check would require reading >2 files, dispatch one `Explore` subagent to look it up and return a one-line answer.

## Analysis Checklist

Apply CLAUDE.md to each changed file. One-liners below are reminders, not the full rule. Serena cues call out where MCP tools beat reading the file.

1. **File structure** — one function/component per file (HARD), filename matches, default export for components, constants in `constants.ts`/`const.ts`, types in `types/` (except component props).
   *Serena:* `get_symbols_overview` on each changed file — if it returns more than one top-level function/class/component export, flag it.
   *ripgrep:* For any changed `.tsx` file, also run `rg -n 'const \w+ = \($' <file>` — a `const X = (` at end of line is the signature of an inline JSX sub-render that should be its own component file. Flag every hit.
2. **Code duplication** — type guards consolidated in `utils/typeGuards.ts`; repeated logic extracted; near-duplicate components/hooks unified.
   *Serena:* before flagging "this looks duplicate", run `find_symbol` on the candidate name. Before flagging "extract this", run `find_referencing_symbols` to size blast radius.
3. **State management** — no `useState`+`useEffect` for derived data; no `useMemo` around already-memoized fns; Zustand individual selectors only.
4. **Imports** — `import type` for type-only; `@/` aliases; correct order (external → internal → types → styles).
5. **Constants & magic values** — magic numbers/URLs/thresholds extracted; enums (not unions) for fixed sets; repeated strings named.
   *Serena:* before suggesting "move this to `constants.ts`", run `find_symbol` to confirm the constant doesn't already exist there under a different name.
6. **Error handling** — `parseErrorAndNotify` for async failures; specific lowercase context (`failed to X for Y`); correct severity; no swallowed errors.
7. **Type safety** — no `any`, no `as any`/`as unknown as T`/`@ts-ignore`; `unknown`+guards over `any`; signatures reflect what's handled.
   *Serena:* `find_symbol` on the type / interface name to check whether a stricter version already exists in `client/src/types/`.
8. **Mantine + Tailwind + colors** — Mantine for content/interactive only; layout via Tailwind divs (no `Group`/`Stack`/`Container`/`Grid`/`Flex`/`Center`/`Box`/`Space`); colors via `appColors`.
9. **React patterns** — props destructured in signature; no `key={index}`; hooks unconditional; complete dep arrays; effect cleanup; targeted memoization only.
   *Serena:* `search_for_pattern` for `useEffect|useMemo|useCallback` in changed components — easier than scanning by eye for missing deps and missing cleanup returns.
10. **Null / undefined** — no misleading fallbacks (esp. `?? 0` on coords); intentional null checks.
11. **DB queries** (server) — indexed columns, `LIMIT`, no `SELECT *`, prefer `INNER JOIN`, single CTE over N+1; weather queries via `getCachedWeatherData`.
12. **GraphQL** — co-located queries; one hook per query; consistent return shape; errors via `parseErrorAndNotify`.
13. **Tests** — every new util/hook/component has a test mirroring source; happy + edge cases; `@/test-utils`, `renderHook`, `act()`, `beforeEach` reset.
14. **Comments & clarity** — one line preferred (max two for genuinely complex); explain *why*; no commented-out code.
15. **Accessibility** — semantic HTML; ARIA on icon-only interactive elements; keyboard navigation works.
16. **Security** — no secrets / server-only env vars in `client/`; `VITE_` prefix only; user input sanitized.

## Output format

Findings grouped by file, ordered High → Low priority:

```
**Category**: <section name>
**File**: <path:line[-line]>
**Issue**: <one sentence>
**Suggestion**: <fix>
**Priority**: High | Medium | Low
```

**Detail level by priority:**
- **High** (correctness, type-safety, error swallowing, security): full snippet + suggested fix.
- **Medium** (convention, perf, duplication): one-liner suggestion; snippet only if non-obvious.
- **Low** (style, comment hygiene): one-liner only, no snippet.

End the report with:

1. **Static analysis** — one-line summary of `lint`, `tsc`, `knip` (clean / N errors / N warnings). If non-clean, surface a few representative items.
2. **Verified** — comma-separated category numbers checked with no findings (e.g. `Verified: 1, 4-7, 13-16`).
3. **Skipped** — categories skipped by scope filter, with reason (e.g. `Skipped: §10 (no SQL changes), §11 (no GraphQL changes)`).

If no issues found, confirm and list verified categories so coverage is visible.
