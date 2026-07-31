# CLAUDE.md

## Answer style — overrides everything below

**Be extremely concise. Sacrifice grammar for the sake of concision.** Fragments. No articles, hedges, preamble, recaps,
summaries. Never restate the request. Answer first.

Mindscape — offline-first PWA for memory-palace / spaced-repetition study. React 19 + Vite + TS. **FSD × Clean
Architecture**. RxDB = on-device source of truth.

## Skills — before writing code

- `vite-react-best-practices` / `vercel-react-best-practices` → perf, bundle, Vite SPA
  deploy ([CODE_STYLE](docs/CODE_STYLE.md) §7–8)
- `vercel-composition-patterns` → component APIs (§4)
- `vercel-react-view-transitions` → optional, needs `react@canary` (§9)
- **N/A — web PWA, not RN:** `react-native-best-practices`, `vercel-react-native-skills`, RN/Flutter parts of
  `mobile-design`

Non-trivial plan → suggest a grill first (user runs it): `/grill-me`, `/grill-with-docs` (writes ADRs + glossary),
`grilling`. Task matches an installed skill → invoke it, don't guess.

## Change rules

**Zero legacy in _code_.** Latest stable deps. No polyfills, fallback branches, deprecated APIs, dead shims.
**Exception — persisted data:** RxDB schemas + anything on-device need real back-compat → migrate
(`app/persistence/schemas.ts`), never orphan stored decks/cards/reviews.

By kind:

- **Refactor** — ruthless, behavior-preserving. Rip out legacy, adapt to current architecture, decompose monoliths.
  Tests stay green, no scope creep, no schema change without a migration. Confirm before large deletions you didn't
  author.
- **New code** — copy the nearest slice's shape. Writes → feature command. Reads → selectors/hooks. Pure logic →
  `shared/lib` or `entities/*/model` + colocated tests. Cross-slice imports via barrels only.
- **Design** — every surface handles loading, error, empty, **offline**. Motion communicates, never decorates. Honor
  `prefers-reduced-motion` + safe areas. Semantic tokens only.
- **Completeness** — no placeholders, no `// ...`, no stubs unless asked. Wire end-to-end: command + store, i18n keys (
  `shared/i18n/locales/en.ts`), barrel exports, all states. Verify `npm run typecheck && npm run lint && npm run test`
  before claiming done.

## Commands

`dev` · `build` (`tsc --noEmit && vite build`) · `typecheck` · `lint` (also FSD boundaries) · `test` / `test:watch` /
`test:cov`.
One file: `npx vitest run src/shared/lib/srs.test.ts` · one test: `npx vitest run -t "creates a new card"`.
**Never `npm run format`** (whole repo) — `npx prettier --write <files you touched>`.

## Architecture — FSD (lint-enforced)

`app → pages → widgets → features → entities → shared`. Import only from strictly lower layers (
`eslint-plugin-boundaries`). Cross-slice via the slice's `index.ts`, never deep paths. Alias `@` → `src`.

**Entities** (`src/entities/<x>/`, reference `card/`) — framework-agnostic:

- `model/types.ts` — types + `makeX()`/`updateX()`: trim, validate, **throw on invariant violation**. No IO, no React.
- `model/store.ts` — `createCollectionStore(key, repo, compare)` or `createSingletonStore(key, repo)` from `shared/lib`;
  the slice declares only its state key and ordering. Never hand-roll the lifecycle.
- `model/selectors.ts` pure reads (readiness is the shared `selectIsReady`) · `model/context.ts` →
  `createStoreContext<XState>('X')` re-exported as `useXStore(selector)` / `useXStoreApi()` · `api/<x>-repository.ts`
  port · `index.ts` barrel.

**DI** — port `shared/api/base-repository.ts` (`Repository<T>`: save/remove/observe); adapters
`shared/api/rxdb/rxdb-repository.ts` (prod) and `in-memory-repository.ts` (tests + live `session` store).
`app/composition-root.ts` builds the DB (`app/persistence/`), wires repo→store, **calls `start()` on every mirroring
store** (`session` is deliberately absent — it owns its writes; `AuthProvider` restores it), exports `services`;
`ServicesProvider` injects via context. Screens never start a store — they read, and gate on
`selectIsReady`. Tests wire their own stores through `shared/test/started.ts`.

**Features = commands (CQRS-lite)** — `src/features/<x>/`, one use-case per file: async fn (entity store, input), e.g.
`createDeck` (`features/deck/create-deck.ts`). All writes through features, all reads through selectors. Components get
the store from `useXStoreApi()` and pass it in. New mutation → new file + export from `features/<x>/index.ts`.

**`shared/lib`** — unit-tested domain logic (`srs`, `streak`, `stats`, `recall`, `deck-tree`, `achievements`, `badges`,
`order`, `naming`) + `use-long-press`, `gestures`, `haptics`, `motion`, `cn()`, `EventBus`.

**UI/routing/i18n/PWA** — `shared/ui/` design system, Tailwind v4 + semantic tokens + `data-theme`; `@dnd-kit`,
`motion`, `sonner`, `lucide-react`. TanStack Router in `app/router.tsx`, `app/auth-guard.ts`. i18next, one locale
`shared/i18n/locales/en.ts`. `vite-plugin-pwa` (`registerType: 'prompt'`), `UpdatePrompt`.

## Read before you touch

- **Any UI** → [CODE_STYLE](docs/CODE_STYLE.md).
- **Drag, reorder, card stack** → [ADR 0001](docs/adr/0001-drag-and-drop-and-card-stacks.md) (a drag only reorders;
  every reachable row is a peer; one engine `useSortableBlock`; stacks built from real items), then CODE_STYLE §10 (four
  causes of drop flicker).
- **Keyboard, viewport, anything bottom-pinned** → CODE_STYLE §11, then [ADR
  0002](docs/adr/0002-keyboard-covers-the-app.md) for why. iOS pans, never resizes; the shell is anchored to
  `--app-height`; **nothing compensates for the pan — the pan is prevented** by giving the scroll body range
  (`--kb-range`), and `visibleBottom()` is the only coordinate bridge. Header must not move when the keyboard opens.
- **Overflow/scroll, focus/autofocus, `env(safe-area-*)`, `touch-action`** → CODE_STYLE §11. Invisible on desktop and in
  jsdom, real on iOS. Check `/dev/kitchen-sink`'s viewport probe **before theorising**; verify on device. That route and
  Settings → Developer ship in **all** builds on purpose — guard, don't delete, before 1.0 (`NEW_ARCHITECHTURE.md`
  T11.G).
- **Mobile/PWA behavior** → [MOBILE_DESIGN](docs/MOBILE_DESIGN.md).
- **Naming anything** → [UBIQUITOUS_LANGUAGE](docs/UBIQUITOUS_LANGUAGE.md). "Session" = auth, never a study pass;
  `known` ≠ Memorized.

## Conventions

- Strict TS: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` → `import type`.
- Tests colocated `*.test.ts(x)`; Vitest + jsdom, **`globals: false`**, `fake-indexeddb`, setup
  `src/shared/test/setup.ts`.
- Prettier: no semicolons, single quotes, trailing comma `all`, printWidth 100.

## Agent skills

Issues/specs → `.scratch/<feature-slug>/` (`docs/agents/issue-tracker.md`). Labels `needs-triage` · `needs-info` ·
`ready-for-agent` · `ready-for-human` · `wontfix` (`docs/agents/triage-labels.md`). Domain docs: `CONTEXT.md` +
`docs/adr/` (`docs/agents/domain.md`).
