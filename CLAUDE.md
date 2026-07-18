# CLAUDE.md

Mindscape — an offline-first PWA for memory-palace / spaced-repetition study. **React 19 + TypeScript on Vite**, organized as **feature areas × Clean Architecture × MVVM**. RxDB is the on-device source of truth.

> **View-layer rebuild in progress.** The app briefly migrated to Angular and was reverted (ADR-0013). The framework-agnostic core — `shared/domain/`, each area's `model/` and `commands/`, the repository ports and RxDB schemas — crossed back untouched; **only the View layer is being rebuilt**. The shell and the deck library are ported; `routes.tsx` still has one real route, and most pages do not exist yet. The plan is `docs/superpowers/plans/2026-07-17-p1-decks.md`. When porting a surface, read the pre-Angular original in git history first — behaviour parity is the bar.

## Skills — consult before writing code

Installed skills carry detailed, version-aware guidance — apply the relevant one instead of working from memory:

- **`vite-react-best-practices`** — React core + Vite SPA rules → [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §7 & §8.
- **`vercel-composition-patterns`** — component API design (compound components, avoid boolean-prop proliferation) → [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §4.
- **`vercel-react-view-transitions`** — route/shared-element transitions, adopted per ADR-0012.
- **`shadcn`** — the component registry this app's design system is built on.
- **Not applicable — this is a React web PWA:** `angular-developer`, `angular-new-app`, `react-native-best-practices`, `vercel-react-best-practices` (Next.js/RSC-specific), and the RN/Flutter parts of `mobile-design`.

**Before building anything non-trivial, stress-test the plan/design** with a grilling skill (suggest it; the user runs it):

- **`/grill-me`** — a relentless interview to sharpen a plan or design before writing code.
- **`/grill-with-docs`** — same, but captures decisions as ADRs and updates [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md).
- **`grilling`** — the auto-invocable variant.

More generally: when a task matches an installed skill (deploy, testing, debugging, design/UX review…), invoke it rather than guessing.

## How to approach each kind of change

Build elegant, high-performance, deeply intuitive solutions. Two principles govern every change:

- **Zero legacy — no backwards compatibility in _code_.** Target modern runtimes and the latest stable versions of our deps (React 19, Vite 8, Tailwind v4). No polyfills, no fallback branches, no deprecated APIs, no dead compatibility shims. **The one exception is persisted data:** RxDB schemas and anything already on a user's device need real backwards compatibility — evolve them with RxDB schema migrations, never a silent breaking change that orphans stored decks/cards/reviews.
- **Optimal over overengineered.** Prefer the simplest execution that scales. Clean, readable, maintainable beats clever. Avoid premature abstraction, deep nesting, and unnecessary third-party deps. A lone toggle stays a `useState`; reach for a reducer only when state actually earns it ([`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §3).

Then apply the rule for the kind of work:

- **Refactoring — ruthless, but behavior-preserving.** Rip out legacy patterns and outdated infrastructure; adapt everything to the current architecture. Decompose monoliths into single-responsibility pieces rather than leaving 500-line components. Constraints: keep tests green, don't silently widen scope, don't touch persisted schemas without a migration. Confirm before large deletions you didn't author.
- **Writing new code — match the area shape, don't invent one.** Place code by feature area; copy the shape of the nearest existing one. **Writes** go through a command, **reads** through store observables, **pure logic** into `shared/domain` or an area's `model/` with colocated tests. Cross-area imports only through barrels.
- **Design quality — make it feel premium and intentional.** Every surface handles all its states — loading, error, empty, **and offline** — not just the happy path. Micro-interactions, spacing, and motion communicate state, never decorate; honor `prefers-reduced-motion` and safe areas. Semantic tokens only (no raw hex, no per-component `dark:`). Follow [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §5 & §9 and [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md).
- **Completeness — ship fully realized code.** No placeholders, no truncated `// ...`, no "implement later" stubs unless explicitly requested. Wire the whole path end-to-end: command + store, i18n keys in `src/shared/i18n/locales/en.ts`, barrel exports, and the states above. Then verify — `npm run typecheck && npm run lint && npm run test` — before claiming it's done.

## Commands

- `npm start` / `npm run dev` — `vite` (dev server on `:5173`)
- `npm run build` — `tsc --noEmit` then `vite build`; the real check that global styles/assets resolve
- `npm run preview` — serves the built output. **Use it before claiming a build-affecting change works** — it catches base-path, lazy-chunk, and PWA issues `dev` hides.
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`
- `npm run lint` — `eslint .`
- `npm run test` — `vitest run` · `npm run test:watch` — `vitest`
- **Running one spec:** `npx vitest run src/decks/pages/use-deck-library.spec.tsx` — the `@/*` alias resolves through `vite.config.ts`, so this works directly.
- **Formatting:** `npm run format` runs Prettier over the whole repo — instead format only files you touched: `npx prettier --write <files>`.

## Architecture — feature areas (ADR-0004)

FSD is gone. Code is organized by feature area:

```text
src/
  decks/  study/  practice/  progress/  auth/  settings/  notifications/  import/
    model/     ← entity types + factories/invariants. Pure TS, no React, no IO.
    data/      ← stores + repository wiring (+ RxDB schemas)
    commands/  ← one use-case per file (CQRS-lite). All writes.
    pages/     ← routed components (+ their ViewModel hooks)
    ui/        ← components owned by the area
  shared/
    domain/    ← pure algorithms, all unit-tested (srs, streak, stats, deck-tree, order…)
    data/      ← Repository<T> port, RxDB + in-memory adapters, Observable, store base classes
    lib/       ← reusable React hooks (use-long-press, use-optimistic-patch, sticky-header…)
    ui/        ← the design system
    config/    ← routes, constants
    i18n/      ← i18next setup + the typed `en` catalog
  shell/       ← app chrome: nav, providers, splash, theme, update prompt
  composition-root.ts  ← builds every store over its adapter and starts them once
  routes.tsx           ← lazy routes per area
```

Not every area has every folder — `import/` is commands only. **The one boundary rule: `shared/` must never import from a feature area** (lint-enforced by `eslint-plugin-boundaries`). Path alias `@/*` → `src/*`.

### Clean Architecture, as it actually exists

- **Domain core** — `shared/domain/` + each area's `model/`. Framework-agnostic, no IO. Factories `makeX()` / `updateX()` trim, validate, and **throw on invariant violations**.
- **Ports** — `Repository<T>` (`shared/data/base-repository.ts`); `AuthGateway` (`auth/data/auth-gateway.ts`) is the second port.
- **Adapters** — `shared/data/rxdb-repository.ts` (production, Dexie/IndexedDB), `shared/data/in-memory-repository.ts` (tests).
- **Composition root** — `composition-root.ts` builds the RxDB database and one store per entity. `createServices()` is production; `createTestServices()` is the same seam with in-memory adapters.
- **Dependency rule:** the core depends on ports, never on RxDB.

### Stores and reactivity

One store per entity, extending `CollectionStore<T>` or `SingletonDocStore<T>` (`shared/data/`). `start()` subscribes to the repository's live RxDB query and mirrors it into observables; `save()`/`remove()` delegate to the repo.

Reactivity is `Observable<T>` (`shared/data/observable.ts`) — app-owned, framework-agnostic, and deliberately **callable**: `store.decks()` reads the current value. React binds to it in exactly one place:

```ts
const decks = useStore(deckStore.decks) // shared/data/use-store.ts — a useSyncExternalStore seam
```

Components reach stores through `useServices()` (`shell/services-provider.tsx`), the DI seam.

**Never call `start()` from a component.** Every reactive store is started once in `composition-root.ts`. Unit tests arrange it themselves.

### Commands = all writes (CQRS-lite)

`<area>/commands/` holds **one use-case per file** — plain async functions taking the store plus input: `createDeck(store, input)`. Components/VMs get the store from `useServices()` and pass it in. To add a mutation, add a file and export it from the area's command index.

Bulk actions are **their own commands** (`setDecksArchived(store, ids, archived)`), not a loop at the caller. Domain rules live in the command, not in the caller that invokes it.

## MVVM (ADR-0008) — read this before touching a page

- **View** = the component. It owns the JSX, and presentation that never leaves it (icon sets, scroll-driven elevation). Nothing else.
- **ViewModel** = a hook co-located with the page, named `use<Page>` (`decks/pages/use-deck-library.tsx`). It owns view state, derived read models (`useMemo`), and orchestration (command dispatch, toasts/undo, confirms, navigation intents). Testable with `renderHook` — no DOM.
- **Model** = stores + commands + domain.

Navigation is exposed as VM intents (`openProfile()`, `openDeck(id)`) — JSX never carries route strings.

### The no-middle-man rule

> **Extract a ViewModel only when a page owns real derived state or multi-step orchestration. A hook that merely forwards to stores and commands is a Middle Man — delete it and let the component read the store directly.**

VMs are **earned, not automatic**. Most pages stay plain components that call `useStore()` directly; that asymmetry is intentional.

**Judge by the logic, not by file size** (most of a big page file is JSX). **If the domain logic is already extracted and tested, a VM has nothing to hold** — a page projecting a tested reducer, or delegating its rules to the tested `normalize*` functions in `shared/config/`, correctly stays plain. See ADR-0008 for the worked table.

The same rule governs everything else:

- **Never write a pass-through wrapper.** A `moveDeckDrawerService` that only forwards to the overlay host is a Middle Man. VMs call **real** services — `toast` (sonner), `openConfirmDialog`, `openPromptDrawer`, `openActionDrawer` — which do real work.
- **A drawer that returns data exposes its own promise-returning `open*()` function, co-located in the drawer's file** (see `openMoveDeckDrawer`, `openFolderDrawer`). That's the component's public API, not a new layer — and it keeps the VM from naming a View component.
- **Don't add a command that only forwards to another.** "Unfile" is `moveDecks(store, ids, null, null)`, not an `unfileDecks`.
- **Barrels export only what other areas consume**, never an area's whole internals.

## UI, routing, i18n, PWA

- **The UI stack is headless-first.** shadcn/ui components over [`@base-ui/react`](https://base-ui.com) primitives, styled by us — never two implementations of the same category. Icons are `lucide-react`; toasts are `sonner`; drag is `@dnd-kit`; gesture/layout animation is `motion`; route transitions use the View Transitions API (ADR-0012). Swipeable rows and the bottom nav **stay custom** — no library ships them.
- **Styling:** Tailwind v4, with a two-layer token system — primitives → semantic roles in `src/styles/tokens.css`, exposed to Tailwind via `@theme` in `src/styles/theme.css`. **Layout and spacing come from Tailwind utilities in JSX — nothing else.** Compose classes with `cn()` (`shared/lib/utils.ts`), never template-literal concatenation. Dark mode is one attribute (`data-theme`) — never per-component `dark:`, never raw hex. Tokens are rem-based so the OS text-size setting scales the app (ADR-0011).
- **Routing:** `react-router` v8 — routes declared in `routes.tsx`, lazy per area. Route constants live in `shared/config/routes.ts`; unported destinations redirect home.
- **i18n:** `i18next` + `react-i18next`. Keys live in the **typed TS catalog** `src/shared/i18n/locales/en.ts` (not JSON) — `i18next.d.ts` types `t()` from it, so a missing key is a type error.
- **PWA:** `vite-plugin-pwa` (Workbox) configured inline in `vite.config.ts`; `shell/update-prompt.tsx` surfaces updates.

## Conventions

- **Read [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) before writing UI** — small single-responsibility components, complex state as reducers, composition over boolean props, semantic tokens only, narrow store reads, `Promise.all` for independent async.
- **Touching drag-and-drop? Read [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md) §10 first.** It names the four causes of drop flicker we have actually shipped, plus the design rules the fixes depend on.
- **Mobile & PWA rules: [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md)** — 430px column, touch targets/thumb-zone, gestures + haptics, drawers/overlays, animation feel, safe areas, offline-first, install/SW-update caveats.
- **Domain vocabulary: [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md)** — use the canonical terms (Deck, Card, Question, Review, Study session, Learner…) in code, UI copy, and commits. It flags overloaded terms: "session" = auth (Guest/Account), never a study pass; `known` (SRS status) ≠ Memorized (manual flag); our overlay word is **Drawer**, never "sheet"; no "palace/room/locus" — we ship Deck/Card/Question.
- **Naming:** files kebab-case (`deck-library-page.tsx`), components PascalCase, hooks `use<Thing>`. Tests colocated as `*.spec.ts(x)`.
- Strict TS with `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax` + `isolatedModules` → use `import type` for type-only imports. An underscore prefix (`_arg`) is the intentional "unused" marker.
- **React 19:** `ref` is a normal prop — **don't use `forwardRef`** (the repo has zero; keep it that way).
- Vitest + jsdom, **`globals: false`** (import `describe/it/expect` from `vitest`), `fake-indexeddb`, setup in `src/test-setup.ts`. Prefer testing a VM hook or a command over rendering a component.
- Prettier: no semicolons, single quotes, trailing-comma `all`, printWidth 100.

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature-slug>/` (gitignored). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `docs/adr/` at the repo root, with [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md) as the glossary. See `docs/agents/domain.md`.
