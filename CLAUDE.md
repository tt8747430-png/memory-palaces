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
- **Mobile & PWA behavior rules live in [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md)** — responsive 430px-column layout, touch targets/thumb-zone, gestures + haptics, sheets/menus/overlays (`@base-ui`), animation feel, interactivity, visual hierarchy, safe areas, offline-first, and install/service-worker-update caveats.
- **Domain vocabulary lives in [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md)** — use these canonical terms (Deck, Card, Question, Review, Study session, Learner…) in code, UI copy, and commits. It flags overloaded terms: "session" = auth (Guest/Account), never a study pass; `known` (SRS status) ≠ Memorized (manual flag); no "palace/room/locus" (we ship Deck/Card/Question).
- Strict TS with `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` + `isolatedModules` → use `import type` for type-only imports.
- Tests are colocated as `*.test.ts(x)`; Vitest + jsdom, **`globals: false`** (import `describe/it/expect` from `vitest`), `fake-indexeddb` and setup at `src/shared/test/setup.ts`.
- Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.
