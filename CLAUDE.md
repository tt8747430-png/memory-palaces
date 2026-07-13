# CLAUDE.md

Mindscape — an offline-first PWA for memory-palace / spaced-repetition study. React 19 + Vite + TypeScript, organized as **Feature-Sliced Design × Clean Architecture**. RxDB is the on-device source of truth.

## Skills — consult before writing code

Installed skills carry detailed, version-aware guidance — apply the relevant one instead of working from memory:

- **`vite-react-best-practices` / `vercel-react-best-practices`** — React performance, bundle/build, Vite SPA deploy → [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §7–§8.
- **`vercel-composition-patterns`** — component API design (compound components, avoid boolean-prop proliferation, React 19 ref-as-prop) → §4.
- **`vercel-react-view-transitions`** — native route/shared-element transitions; optional, needs `react@canary` → §9.
- **Not applicable — this is a web PWA, not React Native:** `react-native-best-practices`, `vercel-react-native-skills`, and the RN/Flutter parts of `mobile-design`.

**Before building anything non-trivial, stress-test the plan/design** with a grilling skill (suggest it; the user runs it):

- **`/grill-me`** — a relentless interview to sharpen a plan or design before writing code.
- **`/grill-with-docs`** — same relentless interview, but captures decisions as ADRs and updates the glossary ([`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md)) as it goes.
- **`grilling`** — the auto-invocable variant; triggers on "grill" phrases when the user wants to pressure-test a plan.

More generally: when a task matches an installed skill (deploy, testing, debugging, design/UX review…), invoke it rather than guessing.

## How to approach each kind of change

Build elegant, high-performance, deeply intuitive solutions. Two principles govern every change:

- **Zero legacy — no backwards compatibility in _code_.** Target modern runtimes and the latest stable versions of our deps (React 19, Vite, Tailwind v4, TanStack Router). Don't add polyfills, fallback branches, or deprecated APIs; don't keep dead compatibility shims alive. **The one exception is persisted data:** RxDB schemas and anything already written to a user's device _do_ need real backwards compatibility — evolve them with RxDB schema migrations (`app/persistence/schemas.ts`), never a silent breaking change that orphans stored decks/cards/reviews.
- **Optimal over overengineered.** Prefer the simplest execution that scales. Clean, readable, maintainable beats clever. Avoid premature abstraction, deep nesting, and unnecessary third-party deps. A lone toggle stays a `useState`; reach for a reducer/machine only when state actually earns it (`docs/CODE_STYLE.md` §3).

Then apply the rule for the kind of work:

- **Refactoring — ruthless, but behavior-preserving.** Rip out legacy patterns, unused boilerplate, and outdated infrastructure; adapt everything to the current architecture (FSD layers, entity stores, feature commands). Decompose monoliths into single-responsibility pieces (§1) rather than leaving 500-line components. Constraints: keep tests green, don't silently widen scope, and don't touch persisted schemas/data without a migration. Confirm before large deletions you didn't author.
- **Writing new code — match the slice shape, don't invent one.** Place code by FSD layer (`app → pages → widgets → features → entities → shared`); copy the shape of the nearest existing slice. **Writes** go through a feature command, **reads** through selectors/hooks, **pure logic** into `shared/lib` or `entities/*/model` with colocated tests. Cross-slice imports only through `index.ts` barrels.
- **Design quality — make it feel premium and intentional.** Every surface handles all its states — loading, error, empty, **and offline** — not just the happy path. Micro-interactions, spacing, and motion communicate state/relationship, never decorate; honor `prefers-reduced-motion` and safe areas. Semantic tokens only (no raw hex, no per-component `dark:`). Follow `docs/CODE_STYLE.md` §5 (Tailwind) & §9 (animation) and `docs/MOBILE_DESIGN.md`.
- **Completeness — ship fully realized code.** No placeholders, no truncated `// ...`, no "implement later" stubs unless explicitly requested. Wire the whole path end-to-end: feature command + store, i18n keys in `shared/i18n/locales/en.ts`, barrel exports, and the states above. Then verify — `npm run typecheck && npm run lint && npm run test` — before claiming it's done.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc --noEmit && vite build` (build typechecks first)
- `npm run typecheck` — types only
- `npm run lint` — ESLint (also enforces FSD layer boundaries; see below)
- `npm run test` / `test:watch` / `test:cov` — Vitest
- Single test file: `npx vitest run src/shared/lib/srs.test.ts`
- Single test by name: `npx vitest run -t "creates a new card"`
- **Formatting:** `npm run format` runs Prettier over the whole repo — instead format only files you touched: `npx prettier --write <files>`.

## Architecture — FSD layers (lint-enforced)

`app → pages → widgets → features → entities → shared`. A module may import **only from layers strictly below it**; `eslint-plugin-boundaries` (`eslint.config.js`) makes violations lint errors. Cross-slice imports must go through the slice's `index.ts` barrel (its public API), never deep paths. Path alias `@` → `src` (both `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`).

## Entities — the domain core

Each `src/entities/<x>/` slice is framework-agnostic and follows one shape (see `entities/card/`):

- `model/types.ts` — types + factory/mutation functions `makeX()` / `updateX()` that trim, validate, and **throw on invariant violations**. No IO, no React.
- `model/store.ts` — a **vanilla Zustand** factory `createXStore(repo)`; its `start()` subscribes to `repo.observe()` (an RxDB reactive query) and pushes results into state, `save()`/`remove()` delegate to the repo.
- `model/selectors.ts` — pure read selectors. `model/context.ts` — React context + `useXStore(selector)` / `useXStoreApi()` hooks.
- `api/<x>-repository.ts` — the repository **port** (interface). `index.ts` — the barrel.

## Repository / dependency injection

- **Port:** `shared/api/base-repository.ts` (`Repository<T>`: save/remove/observe).
- **Adapters:** `shared/api/rxdb/rxdb-repository.ts` (production, Dexie/IndexedDB) and `shared/api/in-memory-repository.ts` (tests, and the live `session` store).
- **Composition root:** `app/composition-root.ts` builds the RxDB database (`app/persistence/database.ts`, `schemas.ts`), wires one repo per entity into its store, and exports the `services` singleton. `app/providers/ServicesProvider.tsx` injects each store through context, so components and tests can swap implementations.

## Features = commands (CQRS-lite)

`src/features/<x>/` holds **one use-case per file** — a plain async function taking the entity store + input, e.g. `createDeck(store, input)` (`features/deck/create-deck.ts`) computes ordering then calls `store.getState().save()`. All **writes** go through features; **reads** go through selectors/hooks. Components resolve a store via `useXStoreApi()` and pass it to the command (see `pages/deck-library/ui/DeckLibraryPage.tsx`). To add a mutation: add a feature file and export it from `features/<x>/index.ts`.

## shared/lib — pure algorithms & cross-cutting hooks

Domain logic lives here (all unit-tested), not in components: `srs.ts` (spaced repetition), `streak.ts`, `stats.ts`, `recall.ts`, `deck-tree.ts`, `achievements.ts`, `badges.ts`, `order.ts`, `naming.ts`. Plus shared hooks/utils: `use-long-press`, `gestures`, `haptics`, `motion`, and `cn()` (clsx + tailwind-merge). Also hosts the `EventBus` and shared contexts.

## UI, routing, i18n, PWA

- **Design system:** `shared/ui/` (`Sheet`, `ActionSheet`, `GlassCard`, `SwipeRow`, `SegmentedControl`, …); compose classes with `cn()`. Tailwind v4 via `@tailwindcss/vite`, semantic tokens with `data-theme` for dark mode. Drag/drop `@dnd-kit`, animation `motion`, toasts `sonner`, icons `lucide-react`.
- **Routing:** TanStack Router, routes declared in code in `app/router.tsx`; `app/auth-guard.ts` gates protected routes.
- **i18n:** i18next, single locale `shared/i18n/locales/en.ts` (types augmented in `i18n/i18next.d.ts`) — add keys there.
- **PWA:** `vite-plugin-pwa` (registerType `prompt`, Workbox) in `vite.config.ts`; `UpdatePrompt` provider surfaces updates.

## Conventions

- **Code-level style rules live in [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md)** — read it before writing UI: small single-responsibility components, logic in hooks, complex state as reducers/machines, composition over boolean props, `cn()` for classes, semantic tokens only (no raw hex / no per-component `dark:`), narrow store subscriptions + `Promise.all` for independent async, and React performance/build rules.
- **Touching a drag-and-drop surface? Read [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §10 first.** It names the four causes of drop flicker we have actually shipped (un-held optimistic state across the RxDB round-trip, a list not sorted by `order`, a `DragOverlay` that isn't the row it came from, and a mount-entrance animating `opacity` on the landing row) plus the two design rules the fixes depend on. Reusable pieces already exist: `useOptimisticPatch`, `dropZone`, `siblingDecks` (`shared/lib`) and `DropIndicator` (`shared/ui`).
- **Mobile & PWA behavior rules live in [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md)** — responsive 430px-column layout, touch targets/thumb-zone, gestures + haptics, sheets/menus/overlays (`@base-ui`), animation feel, interactivity, visual hierarchy, safe areas, offline-first, and install/service-worker-update caveats.
- **Domain vocabulary lives in [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md)** — use these canonical terms (Deck, Card, Question, Review, Study session, Learner…) in code, UI copy, and commits. It flags overloaded terms: "session" = auth (Guest/Account), never a study pass; `known` (SRS status) ≠ Memorized (manual flag); no "palace/room/locus" (we ship Deck/Card/Question).
- Strict TS with `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` + `isolatedModules` → use `import type` for type-only imports.
- Tests are colocated as `*.test.ts(x)`; Vitest + jsdom, **`globals: false`** (import `describe/it/expect` from `vitest`), `fake-indexeddb` and setup at `src/shared/test/setup.ts`.
- Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
