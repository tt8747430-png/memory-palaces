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
(`app/persistence/schemas.ts`), never orphan stored decks/cards/reviews. A migration only repairs _this_ device —
replication writes pulled rows unmigrated — so pair it with a read-side twin in the entity (`completeDeck`,
`coerceCardStyle`). A repair one document can't decide alone (it must see others) is a keeper in `app/persistence/` the
composition root starts — `keep-archive-detached.ts`, `keep-history-capped.ts`.

**Staged is deliberate — never restore it.** Anything in the git index was put there on purpose. A staged deletion is a
decision, not damage: don't `git checkout`/`git restore` it, don't re-add the content, don't "fix" it as an
inconsistency. That includes content other files still reference — repoint the reference instead. If staged work looks
wrong, say so and ask; never undo it unprompted. Same for `git stash`, `git reset` and force-overwrites of user edits.

By kind:

- **Refactor** — ruthless, behavior-preserving. Rip out legacy, adapt to current architecture, decompose monoliths.
  Tests stay green, no scope creep, no schema change without a migration. Confirm before large deletions you didn't
  author.
- **New code** — copy the nearest slice's shape. Writes → feature command. Reads → selectors/hooks. Pure logic →
  `shared/lib` or `entities/*/model` + colocated tests. Cross-slice imports via barrels only.
- **Design** — every surface handles loading, error, empty, **offline**. Motion communicates, never decorates. Honor
  `prefers-reduced-motion` + safe areas. Semantic tokens only.
- **Completeness** — no placeholders, no `// ...`, no stubs unless asked. Wire end-to-end: command + store, i18n keys (
  `shared/i18n/locales/en/`, one file per domain), barrel exports, all states. Verify
  `npm run typecheck && npm run lint && npm run test` before claiming done; after touching startup or imports, also
  `npm run build && npm run check:entry-graph`.

## Commands

`dev` · `build` (`tsc --noEmit && vite build`) · `check:entry-graph` (after `build`: RxDB/supabase off the entry
preloads) · `typecheck` · `lint` (also FSD boundaries) · `test` / `test:watch` / `test:cov`. Supabase integration suites
skip unless `SUPABASE_TEST_URL`/`SUPABASE_TEST_KEY` are set (`SUPABASE_TEST_SECRET_KEY` for the purge).
One file: `npx vitest run src/shared/lib/srs.test.ts` · one test: `npx vitest run -t "creates a new card"`.
**Never `npm run format`** (whole repo) — `npx prettier --write <files you touched>`.

## Architecture — FSD (lint-enforced)

`app → pages → widgets → features → entities → shared`, plus `extensions` off to the side (`app → extensions →
widgets…`). Import only from strictly lower layers (`eslint-plugin-boundaries`). Cross-slice via the slice's `index.ts`,
never deep paths. Alias `@` → `src`.

**Entities** (`src/entities/<x>/`, reference `card/`) — framework-agnostic:

- `model/types.ts` — types + `makeX()`/`updateX()`: trim, validate, **throw on invariant violation**. No IO, no React.
- `model/store.ts` — `createCollectionStore(key, repo, compare, { pending, complete })` or
  `createSingletonStore(key, repo, complete)` from `shared/lib`; the slice declares only its state key, ordering and
  read-side repair. Never hand-roll the lifecycle. `pending` (a `PendingChangePort`) goes to the four content stores
  only — decks, folders, cards, questions — so their writes land in the pending-change log.
- `model/selectors.ts` pure reads (readiness is the shared `selectIsReady`) · `model/context.ts` →
  `createStoreContext<XState>('X')` re-exported as `useXStore(selector)` / `useXStoreApi()` · `api/<x>-repository.ts`
  port · `index.ts` barrel.

**Extensions** (`src/extensions/<x>/`, reference `bible/`) — a self-contained feature behind a manifest. Reaches down
like a page (widgets → features → entities → shared); **only `app` may import it**, and extensions never import each
other. Contributions reach host surfaces through `useExtensionPoint`, never through an import, and carry i18n keys rather
than copy. Its runtime's `activate` is its composition root: its stores and keepers start there, its screens read what
it publishes through `useExtensionServices`, and disabling calls the `deactivate` it returned
(`app/extensions/extension-runtime.ts`). Everything but its screens loads behind the splash. Enablement is
`preferences.extensions`, changed only through `setExtensionEnabled`, and deletes nothing.
`src/app/extensions/registry.ts` is the one core file allowed to name an extension.

**DI** — port `shared/api/base-repository.ts` (`Repository<T>`: save/remove/observe); adapters
`shared/api/rxdb/rxdb-repository.ts` (prod) and `in-memory-repository.ts` (tests + live `session` store).
`app/composition-root.ts` exports **async** `createServices()`: it `await import`s RxDB, Dexie and supabase-js (kept
off the entry graph — `npm run check:entry-graph` after `build`), builds the DB (`app/persistence/`), wires repo→store,
**calls `start()` on every mirroring store** (`session` is deliberately absent — it owns its writes; `AuthProvider`
restores it), starts the persisted-data keepers and `keepImagesCached` (`features/media`). There is no `services`
singleton: `app/Bootstrap.tsx` awaits it behind the splash (error screen on rejection) and passes it to `App`, the router
gets it as context, and `ServicesProvider` injects via context. Screens never start a store — they read, and gate on
`selectIsReady`. Tests wire their own stores through `shared/test/started.ts`.

**Features = commands (CQRS-lite)** — `src/features/<x>/`, one use-case per file: async fn (entity store, input), e.g.
`createDeck` (`features/deck/create-deck.ts`). All writes through features, all reads through selectors. Components get
the store from `useXStoreApi()` and pass it in. New mutation → new file + export from `features/<x>/index.ts`.

**`shared/lib`** — unit-tested domain logic (`srs`, `streak`, `stats`, `recall`, `deck-tree`, `achievements`, `badges`,
`order`, `naming`, `sync-divergence`, `card-style/`) + `use-long-press`, `gestures`, `haptics`, `motion`, `cn()`,
`EventBus`, `useOnline`/`readOnline`, `useImageSrc`.

**Sync (manual)** — nothing leaves the device until Synchronise or Autosync (device-local, on by default).
`features/sync/sync-now.ts` = peek → classify → cycle → confirm; the only question ever put to the learner is a
**destructive divergence** (deleted here, changed elsewhere). `SyncManager` owns the one-shot cycle + Realtime watcher;
`SyncProvider` owns the runner + Autosync; `widgets/sync` = banner + review dialog. Device-local bookkeeping:
`entities/pending-change`, `entities/sync-state`. Images: private buckets, documents store object **paths**, bytes cached
ahead of the read. Account deletion: `features/account` (sync first, 30-day grace, purge by Edge Function).

**UI/routing/i18n/PWA** — `shared/ui/` design system, Tailwind v4 + semantic tokens + `data-theme`; `@dnd-kit`,
`motion`, `sonner`, `lucide-react`. TanStack Router in `app/router.tsx`, `app/auth-guard.ts`. i18next, one locale
`shared/i18n/locales/en/` (one file per domain). `vite-plugin-pwa` (`registerType: 'prompt'`), `UpdatePrompt`.

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
- **Deck settings, algorithms, card styles** → [DECK_SETTINGS_UI_STATUS](docs/DECK_SETTINGS_UI_STATUS.md) for what is
  real (Works / UI only / Invented), then the design spec. Don't build on a control the status doc calls stored-only.
- **Archive, moving decks, subdeck settings** → [ADR 0003](docs/adr/0003-the-archive-is-a-place.md) (archive is a place
  outside every folder/deck; a batch never acts on a subdeck its selected parent carries, `idsWithoutDescendants`;
  placement from one snapshot, `placeDecks`; the main deck owns `MAIN_DECK_SETTINGS`).
- **Anything that needs the network, sync, images, account deletion** →
  [ADR 0004](docs/adr/0004-what-needs-the-network.md) (gate only what the server must answer _now_; every content write
  stays ungated), then the design spec `docs/superpowers/specs/2026-09-15-offline-sync-and-account-lifecycle-design.md`.
  Reads never touch the network: an image is `useImageSrc`, never a URL minted in render.
- **Naming anything** → [UBIQUITOUS_LANGUAGE](docs/UBIQUITOUS_LANGUAGE.md). "Session" = auth, never a study pass;
  "Sync" = one cycle, never a study pass or a login; `known` ≠ Memorized.

## Conventions

- Strict TS: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` → `import type`.
- Tests colocated `*.test.ts(x)`; Vitest + jsdom, **`globals: false`**, `fake-indexeddb`, setup
  `src/shared/test/setup.ts`. Test-only doubles: `shared/test/` (`started`, `fake-cache-storage`),
  `features/sync/testing/fake-cloud.ts` (clock-accurate cloud for Sync tests).
- Prettier: no semicolons, single quotes, trailing comma `all`, printWidth 100.

## Agent skills

Issues/specs → `.scratch/<feature-slug>/` (`docs/agents/issue-tracker.md`). Labels `needs-triage` · `needs-info` ·
`ready-for-agent` · `ready-for-human` · `wontfix` (`docs/agents/triage-labels.md`). Domain docs: `CONTEXT.md` +
`docs/adr/` (`docs/agents/domain.md`).
