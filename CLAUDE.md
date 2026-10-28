# CLAUDE.md

## Answer style — overrides everything below

**Be extremely concise. Sacrifice grammar for the sake of concision.** Fragments. No articles, hedges, preamble, recaps,
summaries. Never restate the request. Answer first.

Mindscape: offline-first PWA for spaced-repetition study. React 19 + Vite + strict TS, **FSD × Clean Architecture**,
RxDB the on-device source of truth, Supabase for accounts and Sync. Product: [PRODUCT.md](PRODUCT.md).

CLAUDE.md holds the repo's rules; the `owner-way` skill (`.claude/skills/owner-way/`) holds the owner's preferences and
workflow.

## Skills — before writing code

- `vite-react-best-practices` / `vercel-react-best-practices` → performance, bundle, Vite SPA.
- `vercel-composition-patterns` → component APIs. `vercel-react-view-transitions` → optional, needs `react@canary`.
- `impeccable` → visual design. `supabase` → anything server-side (`supabase/`, `shared/api/supabase`).
- `tdd` → new logic, test first. `grilling` / `domain-modeling` → a non-trivial plan before code (ADRs, glossary).
- `humanizer` / `writing-guidelines` → docs and any prose the app shows.
- **Not applicable:** React Native, Next.js and Angular skills.

## Change rules

- **No legacy in code.** Latest stable deps. No polyfills, fallback branches, deprecated APIs, dead shims.
- **Persisted data is the exception: it needs real back-compat.** Never orphan stored decks, cards or reviews. A schema
  change ships a migration (`app/persistence/schemas.ts`). A migration repairs only this device (replication writes
  pulled rows unmigrated), so pair it with a read-side twin (`completeDeck`, `coerceCardStyle`). A repair that must see
  other documents is a keeper in `app/persistence/` (`keep-archive-detached`, `keep-capped`,
  `keep-subdeck-orders-owned`), started by the composition root.
- **Merges are field by field against the server copy the device last saw** (`mergeAgainstBase`, ADR 0005). Never a
  last-write-wins handler.
- **Staged is deliberate. Never restore it.** The git index holds the owner's decisions. A staged deletion is not
  damage: don't `git checkout`/`restore` it or re-add the content; repoint whatever still references it. Same for
  `git stash`, `git reset` and force-overwrites. If staged work looks wrong, say so and ask.
- **Refactor:** behaviour-preserving, tests green, no scope creep, no schema change without a migration. Confirm before
  large deletions you didn't author.
- **New code copies the nearest slice's shape.** Writes → a feature command. Reads → selectors/hooks. Pure logic →
  `shared/lib` or `entities/*/model` with a colocated test. Other slices through their barrel only.
- **Design:** every surface handles loading, error, empty and offline. Motion communicates, never decorates. Honour
  `prefers-reduced-motion` and safe areas. Semantic tokens only.
- **Complete, not placeholder.** No stubs or `// ...`. Wire end to end: command, store, i18n keys
  (`shared/i18n/locales/en/`, one file per domain), barrel exports, every state.
- **Verify before claiming done:** `npm run typecheck && npm run lint`, then the tests your change can break
  (`npx vitest related --run <changed files>`). Run the full `npm run test` once before a push that touches shared code
  (`shared/lib`, an entity's model, `app/`, test setup). After touching startup or imports, also
  `npm run build && npm run check:entry-graph`.
- **Parallel agents (worktrees).** Each agent commits one task at a time and checks only what it changed (typecheck,
  lint, related tests; build only after touching startup or imports), never the full suite. The session's branch merges
  every agent's branch, runs the full `npm run test` and `npm run build` once on the merged result, then pushes the
  branch and `main`.

## Commands

`dev` · `build` (`tsc --noEmit && vite build`) · `preview` · `check:entry-graph` (after `build`: RxDB and supabase-js
stay off the entry's preloads) · `brand:assets` (icons and iOS launch screens from `shared/config/brand-mark.ts`;
commit the output) · `typecheck` · `lint` (includes the layer rules) · `test` / `test:watch` / `test:cov`.
One file: `npx vitest run src/shared/lib/srs.test.ts` · one test: `npx vitest run src/x.test.ts -t "creates a card"`.
Supabase integration suites skip unless `SUPABASE_TEST_URL`/`SUPABASE_TEST_KEY` are set (`SUPABASE_TEST_SECRET_KEY`
for the purge). **Never `npm run format`**: `npx prettier --write <files you touched>`.

## Architecture — FSD (lint-enforced)

`app → pages → widgets → features → entities → shared`, plus `extensions` beside them (`app → extensions → widgets…`).
Import from your own layer or below; another slice only through its `index.ts`. `@` → `src`. `eslint-plugin-boundaries`
enforces it (`eslint.config.js`).

- **app/** — `main.tsx` → `Bootstrap.tsx` awaits the async `createServices()` (`composition-root.ts`) behind the splash
  (error screen on rejection) and hands it to `App`. `createServices()` `await import`s RxDB, Dexie and supabase-js
  (off the entry graph), builds the DB (`persistence/`), wires repo → store, calls `start()` on every mirroring store
  (`session` excepted: `AuthProvider` restores it), starts the keepers and `keepImagesCached`. No `services` singleton:
  the router gets it as context, `ServicesProvider` injects it. Also `router.tsx` (TanStack, code-based, lazy screens
  in `routes/*-screens.ts`), `auth-guard.ts`, `providers/`, `extensions/`.
- **pages/<x>/** — one per route; composes widgets. A page with many acts has one hook in `model/`
  (`pages/deck-library/model/use-library.ts`); that hook is its test surface.
- **widgets/<x>/** — composite UI (`deck-tree`, `study-session`, `sync`, `rewards`).
- **features/<x>/** — commands (CQRS-lite), one use case per file: an async fn taking the entity store and input
  (`features/deck/create-deck.ts`). Components take the store from `useXStoreApi()` and pass it in. Also the study
  machines (`review`, `quiz`, `match`).
- **entities/<x>/** (reference `card/`) — framework-agnostic. `model/types.ts`: types + `makeX()`/`updateX()` that
  trim, validate and **throw on an invariant violation**; no IO, no React. `model/store.ts`: `createCollectionStore` or
  `createSingletonStore` from `shared/lib`; the slice declares only its key, order and read-side repair. Every synced
  store gets `pending` (a `PendingChangePort`) so each write waits in the pending-change log until a Sync confirms it.
  `model/selectors.ts` (readiness is `selectIsReady`), `model/context.ts` (`createStoreContext` →
  `useXStore(selector)` / `useXStoreApi()`), `api/<x>-repository.ts` (the port), `index.ts`.
- **extensions/<x>/** (reference `bible/`) — a feature behind a manifest. Only `app` imports it; extensions never import
  each other. Host surfaces get its contributions through `useExtensionPoint`, carrying i18n keys. Its runtime's
  `activate` is its composition root (stores, keepers, `context.pending(key)`); disabling calls the `deactivate` it
  returned. Enablement is `preferences.extensions` (`setExtensionEnabled`) and deletes nothing. An overview route holds
  its feature switches (`preferences.disabledFeatures`, `setExtensionFeature`); a route naming a feature is withdrawn
  while it is off (router guard, then `FeatureGate`). `app/extensions/registry.ts` is the one core file that names an
  extension.
- **shared/** — `api` (port `Repository<T>` in `base-repository.ts`; adapters `rxdb/rxdb-repository.ts` and
  `in-memory-repository.ts` for tests and the `session` store; `supabase/`), `lib` (pure, tested domain logic and
  hooks), `ui` (design system: Tailwind v4, semantic tokens, `data-theme`), `config`, `i18n` (English only), `test`.

**Screens never start a store.** They read, and gate on `selectIsReady`.

### The places and the main slices

Every route is in `app/router.tsx`; paths in `shared/config/routes.ts`.

- **Library** (`/`, `/folders/$folderId`, `/archived`, `/notifications`) — `pages/deck-library`, `archived-decks`;
  `widgets/deck-tree` (`useLibraryArrangement`: the one order, filter and shelf headings); `features/deck`, `folder`;
  `entities/deck`, `folder`.
- **A deck** (`/decks/$deckId/…`: settings, algorithm, card style, TTS, study, match, quiz, questions, cards, paste,
  import) — `pages/deck-detail`, `deck-settings`, `study`, `quiz`, `match`, `card-editor`, …;
  `widgets/study-session`, `practice-modes`, `content-editor`; `features/review`, `card`, `question`, `content`;
  `entities/card`, `question`, `learning-history`.
- **Profile** (`/profile`, `/streak`, `/badges`, `/achievements`) — `widgets/profile-header`, `rewards`,
  `streak-calendar`; `entities/progress`, `profile`.
- **Settings** (`/settings/…`: profile, password, sync, privacy, extensions, swipe, toolbar, help, about) —
  `entities/preferences`; `features/account` (deletion: sync first, 30-day grace, purge by Edge Function).
- **Auth** (`/login`, `/signup`, `/forgot`, `/welcome`, `/auth/callback`) — `entities/session` ("Session" = auth: a
  guest or an account).
- **Bible** — `extensions/bible`, routes from its manifest. **`/dev/kitchen-sink`** and Settings → Developer ship in
  every build on purpose: guard, don't delete, before 1.0.

**Sync (manual).** Nothing leaves the device until Synchronise or Autosync (a preference, on by default). An account's
first Sync on a device runs under the splash (`app/providers/use-first-sync.ts`, bounded). `features/sync/sync-now.ts`:
peek → classify → cycle → confirm; the only question put to the learner is a destructive divergence (deleted here,
changed elsewhere). `SyncManager` (`shared/api/supabase`) owns the cycle and the Realtime watcher; `SyncProvider` the
runner and Autosync; `widgets/sync` the banner and review dialog. Device-local bookkeeping: `entities/pending-change`,
`sync-state`. Images: private buckets, documents hold object paths, bytes cached ahead of the read (`useImageSrc`).

## Read before you touch

- **Any UI** → [CODE_STYLE](docs/CODE_STYLE.md): components, Tailwind, performance, motion, drag, gestures, mobile and
  PWA, and the device-only traps (overflow, focus, safe areas, `touch-action`, the keyboard). Device-only bugs: check
  `/dev/kitchen-sink`'s viewport probe before theorising, then verify on a phone.
- **Why it is this way** → `docs/adr/` (index: [README](docs/adr/README.md)). By area: drag, reorder, card stacks →
  [0001](docs/adr/0001-drag-and-drop-and-card-stacks.md); keyboard and anything bottom-pinned →
  [0002](docs/adr/0002-keyboard-covers-the-app.md); archive, moving decks, subdeck settings →
  [0003](docs/adr/0003-the-archive-is-a-place.md); network, sync, images, account deletion →
  [0004](docs/adr/0004-what-needs-the-network.md); conflict handlers, `push_documents` →
  [0005](docs/adr/0005-merge-against-what-you-saw.md); status bar and theme colour →
  [0007](docs/adr/0007-ios-paints-the-status-bar.md). Deck settings, extensions: see the index. Contradicting an ADR →
  say so, then amend it.
- **What exists and what broke before** → [HISTORY](docs/HISTORY.md).
- **Naming anything** → [UBIQUITOUS_LANGUAGE](docs/UBIQUITOUS_LANGUAGE.md). "Session" = auth, never a study pass;
  "Sync" = one cycle; `known` (shown as Mastered) ≠ Memorized.
- **Prompts for agents** → [prompts/README.md](prompts/README.md).

## Conventions

- Strict TS: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` → `import type`.
- **Tests** colocated as `*.test.ts(x)`. Vitest in jsdom, **`globals: false`** (import `describe/it/expect/vi`), setup
  `src/shared/test/setup.ts`. A test that needs IndexedDB imports `fake-indexeddb/auto` first (after any
  `// @vitest-environment` line). Doubles:
  `shared/test/` (`started` wires a store the way the composition root does, `fake-cache-storage`,
  `render-with-providers`), `features/sync/testing/fake-cloud.ts` (a clock-accurate cloud for Sync tests).
- Prettier: no semicolons, single quotes, trailing commas `all`, printWidth 100.

## Agent skills

Issues and specs → `.scratch/<feature-slug>/` ([issue tracker](docs/agents/issue-tracker.md)). Labels:
[triage-labels](docs/agents/triage-labels.md). Domain docs: [domain](docs/agents/domain.md).
