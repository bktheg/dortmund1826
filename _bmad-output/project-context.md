---
project_name: 'dortmund1826'
user_name: 'Christopher'
date: '2026-06-22'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 37
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Vue** 3.5.13 — Composition API (`<script setup lang="ts">`) is the project standard
- **TypeScript** ~4.7.4 — `allowJs: true`, ES2019 target, `@/` alias for `src/`
- **Vite** 3.0.1 — build tool; `__APP_VERSION__` global defined via `vite.config.ts`
- **Vue Router** 4.5 — web history mode; all routes except home use lazy `import()`
- **Pinia** 2.0.17 — `defineStore({ id, state, actions })` pattern; no getters pattern established
- **Mapbox GL** v2.15.0 — loaded via CDN script tag in `index.html`, NOT an npm package; `@types/mapbox-gl` provides TS types only
- **Axios** 1.7.9 + vue-axios 3.4.1 — HTTP client; imported directly as `axios`, not from vue instance
- **mitt** 3.0.0 — event bus; provided app-wide via `app.provide('emitter', emitter)`, consumed with `inject('emitter')`
- **vue-final-modal** 4.4.4 — modal system; requires `<ModalsContainer />` in App root template
- **Lodash** 4.17.21 — imported as named sub-module (`import _debounce from 'lodash/debounce'`)
- **vue3-treeselect** 0.1.10 + local vendored copy in `src/components/treeselect/` (JS, not TS)
- **vue-easy-spinner** 0.1.0 — registered globally with prefix `easy`
- **Data API**: JSON files fetched from `import.meta.env.VITE_SERVER_URL`; cache-busted with `?v=${__APP_VERSION__}`

## Critical Implementation Rules

### Language-Specific Rules

- Always use `<script setup lang="ts">` — this is the project standard; do not use the Options API for new code
- Import path alias `@/` resolves to `src/` — prefer it over relative paths for cross-directory imports
- `allowJs: true` is set — vendored JS in `src/components/treeselect/` may require `// @ts-ignore` on imports from it
- No strict mode in tsconfig — do not add `"strict": true` without discussion, as it would break existing code
- `__APP_VERSION__` is a compile-time global injected by Vite — no need to import it, use directly in expressions
- Mapbox GL must be typed via `import type mapboxgl from 'mapbox-gl'` (types only) — never do a value import since there's no npm package; the runtime global is loaded by the CDN script
- Domain data from the API uses single-letter property names (e.g. `n`, `f`, `r`, `e`, `a`, `k`, `l`, `t`, `p`, `i`, `b`) — always define a typed `*Export` interface for raw API data and map it to a proper domain class; never use single-letter props in UI code
- Domain entities are ES classes with constructors (e.g. `Parzelle`, `Gemeinde`, `Flur`), not plain objects or interfaces — follow this pattern for new domain types
- Async data fetching uses `async/await` inside Pinia actions with explicit try/catch/finally; use the same pattern for new actions

### Framework-Specific Rules

**Vue Components:**
- Component files use PascalCase naming (e.g. `LoadingSpinner.vue`, `HaeuserbuchStreet.vue`)
- All new components must use `<script setup lang="ts">` only — no `export default {}` blocks
- The emitter (mitt) is injected via `inject('emitter') as Emitter<any>` — never import it directly
- `router.afterEach` emits `"map-resize"` on every route change — Map.vue listens for this; be aware when adding routes or navigation logic
- Lazy-load all new routes with `() => import(...)` — only HomeView is eagerly loaded

**Pinia Stores:**
- Pattern: `defineStore({ id: 'name', state: () => ({ ... }), actions: { ... } })`
- State uses native `Map<K,V>` and `Set<T>` (not plain objects) for keyed/unique data — follow this for new stores
- Guard against duplicate fetches: check loading state and existing data before fetching (see `fetchParzellen` pattern)
- Use `this.$patch(state => { ... })` when mutating nested Map/Set state
- Import stores in components with `useXxxStore()` and destructure reactive refs via `storeToRefs(store)`

**Vue Router:**
- Routes use named navigation (`{ name: 'routeName', params: { ... } }`) — use names, not hardcoded paths
- Watch `route.params` with `{ immediate: true }` to react to both initial load and navigation changes
- Use `onBeforeRouteUpdate` for in-component route change handling where appropriate

### Testing Rules

- **Unit tests**: Vitest 0.34.x + @vue/test-utils + jsdom — installed; run with `npm test`
  - Use `vitest@^0.34` — the 1.x/2.x line requires Vite 5+ and is incompatible with this project's Vite 3
  - Test files live alongside source: `src/stores/*.spec.ts`, `src/services/*.spec.ts`
  - Mock `axios` via factory: `vi.mock('axios', () => ({ default: { get: vi.fn() } }))` — use a real Pinia instance via `createPinia()` + `setActivePinia()` in `beforeEach`
  - Highest value targets already covered: `infoService`, `quellenService`, `searchService` (SearchResult), `parzelleStore`
- **E2E tests**: Playwright is the recommended next step — the app runs fully against `public/` mock data with empty `VITE_SERVER_URL`, so no backend is needed; Mapbox tiles require an API key but DOM content is testable without tile rendering
- Type checking remains a separate gate: `vue-tsc --noEmit` (already in `npm run build`)

### Code Quality & Style Rules

- No ESLint or Prettier config exists — there is no enforced formatter; follow the style visible in existing files
- Indentation: 4 spaces in `.vue` and `.ts` files (as seen throughout the codebase)
- No trailing comments explaining what code does — names should be self-explanatory
- UI display text is in **German** — all labels, button text, error messages, and user-facing strings must be German
- Domain terminology uses German names: `Gemeinde`, `Flur`, `Parzelle`, `Bürgermeisterei`, `Kreis`, `Eigentuemer`, `Haeuserbuch`, `Mutterrolle` — do not translate these to English in code
- File naming: views in `src/views/` use `*View.vue` suffix; stores in `src/stores/` use `*Store.ts` suffix; services in `src/services/` use `*Service.ts` suffix
- No linting script in `package.json` — `type-check` (`vue-tsc --noEmit`) is the only automated code quality check

### Development Workflow Rules

- **Dev server**: `npm run dev` (Vite, default port)
- **Staging preview**: `npm run data-preview` — runs on port 4173 with `--mode staging` (uses `.env.staging` for `VITE_SERVER_URL`)
- **Production build**: `npm run build` — runs `vue-tsc --noEmit` and `vite build` in parallel via `npm-run-all`
- **`VITE_SERVER_URL`** is empty by default — when empty, axios requests resolve to the Vite dev server root, which serves `public/` as static files; the `public/` directory contains a full set of real JSON fixtures (`admin.json`, `bezeichnungen.json`, `eigentuemer.json`, `parzellen_*`, `mutterrollen_*`, etc.) so the app is fully functional with no backend; set `VITE_SERVER_URL` in `.env` only to point at an external data server. **In production, `VITE_SERVER_URL` is also intentionally left empty** — the built app and its data JSON files are served from the same domain (relative paths), so the behaviour is identical to dev with no URL prefix needed.
- **Version** is taken from `package.json` `"version"` field (`npm_package_version`) and exposed as `__APP_VERSION__` — bump `package.json` version when releasing; the value is appended as `?v=` on all data JSON requests for cache busting
- No CI/CD config detected in the repository
- Git branch: working on `main` directly (no feature branch convention observed)

### Critical Don't-Miss Rules

- **Never import mapbox-gl as a value** — it is not an npm dependency; only `import type` is valid. The `mapboxgl` global is available at runtime via the CDN script in `index.html`
- **Never use single-letter API field names in UI or business logic** — define `*Export` types for raw data and map to domain classes immediately after fetch (see `parzelleStore.ts`)
- **Never use Options API for new components** — the project standard is `<script setup lang="ts">` exclusively
- **Do not mutate nested `Map`/`Set` state in Pinia directly** — use `this.$patch(state => { ... })` to ensure reactivity
- **`buildPath()` in `searchService.ts` has silent bugs** — the `Buergermeisterei` and `Flur` branches are missing `return` statements and silently return `''`; do not copy this pattern
- **`__APP_VERSION__` is not typed** — declare it in `src/env.d.ts` if TypeScript complains: `declare const __APP_VERSION__: string`
- **Mapbox layer IDs follow the pattern `wms-{id}-layer` / `wms-{id}-source`** — check for existing layer/source before adding (see `getLayer()`/`getSource()` guards in Map.vue)
- **All user-visible text must be in German** — do not introduce English strings in templates or computed labels

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-06-22 (testing section updated after initial test suite added)
