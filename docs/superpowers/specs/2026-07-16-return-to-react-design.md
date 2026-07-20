# Design: return to React — keep the core, replace the View layer

**Date:** 2026-07-16
**Status:** Draft — awaiting review
**Amended 2026-07-17:** the implementation plan (`../plans/2026-07-16-return-to-react.md`) is
authoritative where the two disagree. A verification pass reversed four of this spec's decisions:
**PWA** is `generateSW` (`main`'s proven config), not `injectManifest` + `src/sw.ts`; **i18n** ports
`main`'s typed `locales/en.ts` + `i18next.d.ts` instead of retaining `public/i18n/en.json`; the
**token bridge** is `main`'s `src/styles/theme.css` restored (`--p-*` → `--ms-*`) — the "`--sw-*`
semantic palette" this spec inherited from ADR-0001 does not exist (`--sw-*` is the swipe-accent set
only); and the **two `@angular`-importing "commands"** are in fact TestBed spec files — all 100
command implementations are clean.
**Branch:** `angular-migration` (P0 starts a new branch; see "Branching")
**Supersedes:** `2026-07-16-angular-mvvm-and-dependency-cleanup-design.md` (approved earlier today,
implemented in `408267a`; its MVVM and barrel work is preserved in substance, not in framework)

## Context

The request: port the app back to React, carrying over the architecture lessons the Angular work
produced (Clean Architecture, DI, MVVM), building UI on **shadcn** rather than hand-rolled
components, and routing on **React Router**. Stated constraint: _"clean architecture MVVM and good
implementations. not old backwards compatibility and legacy code and implementation."_

This reverses ADR-0003/0006. Two findings from investigating the tree change what the project is.

### Finding 1 — `legacy-react/` is redundant, and the real reference is `main`

`legacy-react/` is a **gutted copy**. The port tracker's `[x]` rows are genuinely deleted from it:
`srs.ts`, `streak.ts`, the entity stores, and `quiz-machine.ts` are gone. What remains is 251 files /
23,030 lines of un-ported View layer with no domain core beneath it and no `node_modules` — it has not
been buildable for 18 commits.

**But the pristine original is still on `main`**, and it is complete and runnable: 497 TS/TSX files,
React 19, TanStack Router, Vite 8, `src/shared/lib/srs.ts` intact, and every area Angular never
reached (`study-session`, `profile`, `streak-calendar`, `badges`, `login`) present.

Two facts verified:

- **All 251 files in `legacy-react/` are byte-identical to their `main:src/` counterparts.** Zero
  differ; zero are absent from `main`.
- **`angular-migration` forked from `main` at `87e68f4`, and `main` has 0 commits since.** It is
  frozen at the fork point.

Therefore `legacy-react/` carries **no information that `main` does not hold**, in better condition.
It is deleted in P0 — 23,030 lines out of the working tree, zero loss — and the behavioural reference
becomes a **runnable worktree** on `main`:

```sh
git worktree add ../mindscape-ref main && cd ../mindscape-ref && npm i && npm run dev
```

This is a strictly better parity bar than reading gutted source: behaviour can be **observed**, not
inferred. It matters most for P3/P5, which are net-new builds with no Angular precedent.

The tracker's header ("Files remaining: 256") is stale by ~5 and should not be trusted as a status;
the tracker is retired with `legacy-react/` in P0.

### Finding 2 — the Angular tree is mostly not Angular

Measured against the current tree:

| Layer                       | Lines                 | Files importing `@angular` | Disposition                                     |
| --------------------------- | --------------------- | -------------------------- | ----------------------------------------------- |
| `shared/domain/`            | 2,886 (18 spec files) | **0**                      | Copied verbatim                                 |
| `*/model/`                  | 1,262                 | **0**                      | Copied verbatim                                 |
| `*/commands/`               | 3,498 (100 files)     | **2 of 100**               | Copied, 2 files de-Angular'd                    |
| `*/data/`                   | 1,290                 | 13 of 26                   | Ports/adapters copied; store base re-primitived |
| `pages/` + `ui/` + `shell/` | 11,324                | all                        | **Discarded, rebuilt in React**                 |

≈**7,600 lines** of clean-architecture core — the tested domain algorithms, the entity factories and
invariants, the CQRS-lite commands, the `Repository<T>` port and its adapters — are already
framework-agnostic TypeScript. They survive the move by being copied.

`CollectionStore` is the clearest case: it touches Angular in **exactly one place**, `signal` from
`@angular/core`. The repository port, the `observe` subscription, the sort, `save`/`remove`, and the
`start`/`stop` lifecycle are all framework-agnostic already.

**Therefore this project is not "port the app back to React." It is: replace the View layer and the
store reactivity primitive; keep the core.** The ≈11,300-line View layer is the genuine write-off, and
it is unavoidable in any direction — it is templates.

That ADR-0004 (feature areas) and ADR-0007 (hand-rolled nav) both survive this reversal intact is
evidence the architecture work was real and the framework was the accident.

## Scope of "zero legacy"

The user's constraint is honoured, and lands precisely on the original React app's implementation: FSD
layering, hand-rolled widgets, TanStack Router, zustand, `vaul`, and the bespoke dialogs and menus
written against `@base-ui`. **None of it is carried across.** `main` is consulted for _what the app
does_, never copied for _how it did it_.

The distinction is between a **dependency** and an **implementation**. `@base-ui/react` returns
underneath shadcn (see Non-goals) — that is not the legacy coming back, because we never write against
it directly; shadcn's generated components do. What is rejected is the hand-rolled component layer the
original built on top of it.

It does **not** extend to `shared/domain/`. That code has no legacy in it — it is the newest code in
the repo, carries 18 passing spec files pinning SRS/streak/stats behaviour, and rewriting it from
scratch would discard tested behaviour for no gain. Copying it _is_ the zero-legacy outcome.

**Persisted data:** the app is pre-release with no user data. CLAUDE.md's carve-out for RxDB schemas
is therefore **inert for this project** — schemas are redesigned freely, no migrations, no compat
shims. The carve-out goes live at launch, not now.

## Non-goals

- **No FSD.** ADR-0004's feature areas stand.
- **No DI container.** The composition root and the ports/adapters seam are what carried value.
  Angular's injector does not port; a decorator-based container in React is overengineering.
- **No revival of** zustand, TanStack Router, `vaul`, or FSD.
  - **`@base-ui/react` is a deliberate exception**, and not a legacy carry-over: shadcn's `base`
    variant is built on Base UI (`import { Drawer } from '@base-ui/react/drawer'`). The _dependency_
    returns as shadcn's primitive layer; the hand-rolled dialogs and menus `legacy-react` wrote
    against it do not.
  - **`vaul` is dropped — but only because we choose `--base base`.** Verified from source: shadcn's
    `radix` variant Drawer still imports `vaul`; only the `base` variant uses Base UI. radix is the
    CLI default, so the flag is what makes this true, not shadcn's evolution.
- **No RxDB migrations** (pre-release).
- **No Angular tree kept alive alongside.** Two half-apps and a doubled dependency tree, when the
  tracker shows Angular never reached parity, is not a fallback that can ship.
- **No behaviour redesign.** Design changes are separate work. Parity is measured against two frozen
  references, both read from git rather than the working tree (see "Parity references").

## Decisions

### Stack

| Concern | Choice                                                             | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build   | **Vite 8**                                                         | Vite 8's Rolldown merge replaces esbuild+Rollup with one Rust bundler (10–30× faster builds, full plugin compat), which neutralises the only argument for leaving (Rsbuild/Rspack speed). React Router 8, Vitest, Tailwind v4, and shadcn all assume Vite.                                                                                                                                                                                                                                                                                                                       |
| Router  | **React Router 8, data mode**                                      | `createBrowserRouter` + `lazy` route modules + `middleware` arrays (stable in v8). Data mode, not framework mode — framework mode drags in SSR machinery an offline-first PWA does not want. `middleware` maps ~1:1 onto `auth.guard.ts`. v8 landed 2026-06-17 and keeps data mode intact; `RouterProvider` moves to `react-router/dom`.                                                                                                                                                                                                                                         |
| UI      | **shadcn/ui**, `base` variant (Base UI) + Tailwind v4              | Per request. **`base`, not `radix`:** shadcn's `Drawer` — this app's most important overlay — is Base UI only ("the drawer component now uses Base UI instead of Vaul"), and ships gesture swipe-to-dismiss, snap points, nested drawers, and virtual-keyboard awareness natively. Owns `Drawer` (bottom sheets), `Dialog`, `AlertDialog` (confirms), `Field`/`Input`/`Select`/`Switch`, `Button`, `ToggleGroup` (segmented), `sonner` (toasts), `DropdownMenu`/`Popover`, `Progress`, `Tabs`, `Combobox`, `Avatar`, `Card`, `Empty`, `Skeleton`, `Badge`, `Separator`, `Alert`. |
| Data    | **RxDB** (Dexie/IndexedDB)                                         | Unchanged source of truth; schemas redesigned freely.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| i18n    | **react-i18next**                                                  | Transloco is Angular-only. `public/i18n/en.json` is retained as-is.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| PWA     | **`vite-plugin-pwa`**, `strategies: 'injectManifest'`, `src/sw.ts` | Replaces ngsw. `injectManifest` gives a TypeScript-authored SW; `useRegisterSW()` from `virtual:pwa-register/react` returns `{ needRefresh, offlineReady, updateServiceWorker }` — exactly `shell/update-prompt.ts`'s requirement. Serwist was considered and rejected: it offers the same TS-first SW authoring but ships no React hook, so it is more work for less function. Workbox's stagnation does not bite an app whose SW only precaches a shell.                                                                                                                       |
| DnD     | **`@dnd-kit`**                                                     | The one legacy-react dependency revived. Deck-tree reorder/reparent never reached Angular (ADR-0002 assigned it to PrimeNG Tree; never done), so it gets built once, properly, here.                                                                                                                                                                                                                                                                                                                                                                                             |
| Test    | **Vitest + jsdom + Testing Library**                               | `globals: false` retained. Vite owns `@app/*`, so single-spec runs work directly — CLAUDE.md's "`npx vitest` doesn't resolve the alias" caveat dies with the Angular builder.                                                                                                                                                                                                                                                                                                                                                                                                    |

### Structure

ADR-0004 unchanged: `src/<area>/{model,data,commands,pages,ui}` across
`decks/ practice/ study/ auth/ settings/ notifications/ import/`, plus `shared/{domain,data,ui,config}`
and `shell/`. The one boundary rule stands: **`shared/` never imports from a feature area.**

### DI — composition root + `ServicesProvider`

The composition root builds the RxDB database and binds one repository per entity into a services
object, exposed via a single `ServicesProvider` context. Tests swap the in-memory adapter at the same
seam. Components reach it via `useServices()`.

This is the seam ADR-0004 already describes, expressed in React's idiom. The `Repository<T>` port,
`rxdb-repository.ts`, and `in-memory-repository.ts` are copied across largely unchanged.

### Stores — framework-agnostic classes, bound by `useSyncExternalStore`

`CollectionStore` / `SingletonDocStore` swap Angular's `signal()` for a small (~30-line)
framework-agnostic observable with `get`/`set`/`subscribe`. React binds via:

```ts
const decks = useStore(deckStore.entities) // useSyncExternalStore under the hood
```

**`start()` is still called only at the composition root, never from a component.** Stores remain
testable with no React in the room.

**The store _subclasses_ do need a mechanical edit** — an earlier draft of this spec wrongly said they
were untouched. Each carries `@Injectable({ providedIn: 'root' })` and an `@Inject(TOKEN)` constructor
param, and the `data/` layer declares **11 `InjectionToken`s across 18 Angular decorators**. All of it
is deleted: the token declarations go (the `Services` object replaces them), the decorators go, and
`constructor(@Inject(DECK_REPOSITORY) repo: Repository<Deck>)` becomes
`constructor(repo: Repository<Deck>)`. **Class bodies survive intact** — `compare`, `decks =
this.entities`, and every method. The stores were already written to be directly constructible
(`new DeckStore(repo)`) so unit tests could skip DI, which is exactly what makes this mechanical.

Two stores need more than de-decorating:

- **`SessionStore` extends no base class.** It uses `signal` directly and exposes `load()`/`set()`/
  `clear()` rather than `start()` — which is why ADR-0008 excludes it from composition-root bootstrap:
  auth state is loaded once by `restoreSession`, not mirrored from a live query. Its two signals are
  re-primitived by hand.
- **`AuthGateway`** is a second port beside `Repository<T>` (`auth/data/auth-gateway.ts`, with
  `local-auth-gateway.ts` as its adapter). It binds into `Services` alongside the repositories.

### MVVM — the ViewModel is a hook

Angular's VM is a class because per-component `providers` plus `computed` supply scoped DI and
reactivity for free. React has no scoped injector, so a VM class must be hand-bound to rendering —
`useSyncExternalStore` tracking per VM, maintained forever, returning nothing. React's per-component
unit of scoped state plus orchestration **is** a hook.

```ts
// decks/pages/use-deck-library-vm.ts
export function useDeckLibraryVm() {
  const { deckStore, cardStore } = useServices()
  const decks = useStore(deckStore.entities)
  const cards = useStore(cardStore.entities)
  const navigate = useNavigate()
  const [selection, setSelection] = useState<string[]>([])

  const dueCounts = useMemo(() => dueCountsPerDeck(decks, cards, dayKey(now())), [decks, cards])

  return {
    decks,
    dueCounts,
    selection,
    openDeck: (id: string) => navigate(ROUTES.deck(id)),
    archiveSelected: () => setDecksArchived(deckStore, selection, true),
  }
}
```

**The no-middle-man rule ports verbatim (ADR-0008):** a hook that only forwards to stores and commands
is a Middle Man — delete it and let the component read the store directly. VMs are earned, not
automatic. The three earned VMs (`deck-library`, `deck-questions`, `deck-content`) become three hooks.
`quiz-session` and the settings editors stay plain, for the reason ADR-0008 already gives: their logic
lives in the tested `quizReducer` and `normalize*` functions, so a VM would have nothing to hold.

The rule's corollaries stand: no pass-through wrapper services; a sheet returning data exposes its own
promise-returning `open*()` co-located in the sheet's file; no command that only forwards to another;
barrels export only what other areas consume.

### UI ownership

shadcn owns the categories listed above. It ships **no** swipe row, bottom nav, speed dial, or dnd
tree — **ADR-0007's reasoning holds unchanged** and those stay custom. Navigation is exposed as VM
intents; templates never carry route strings.

Three consequences of the `base` variant, each of which deletes prior work:

- **ADR-0009 dies entirely.** Its ~80-line PrimeNG bridge, and the `SHEET_MOTION_MS`-coupled-to-CSS
  wart it called "the one genuine wart", existed only because "imperative-with-result and headless
  don't come in the same box" in PrimeNG. Base UI's `Drawer` is headless by construction.
- **Both overlay-stacking contracts die.** ADR-0002's CDK-vs-PrimeNG stack and ADR-0009's `zIndex`
  ordering in `app.config.ts` are both obsolete: shadcn overlays manage their own stacking, and manual
  `z-index` on them is a rule violation. The `--ms-z-nav` token survives for the hand-rolled nav only.
- **Two hand-rolled primitives are candidates for deletion, pending verification in P1:**
  `use-drag-to-dismiss.ts` (Base UI Drawer ships gesture dismiss + snap points) and the
  `useKeyboardInset` / `--kb` machinery (Base UI Drawer is virtual-keyboard aware). The 07-14 spec's
  decision — "the keyboard lifts **only** bottom sheets" — is exactly what the primitive does
  natively. **Verify before deleting**; if Base UI's behaviour differs, the custom code stays.

**ADR-0007's M3 basis does not survive, though its decision does.** The nav was built to the Material 3
spec because "the app is already Material M3 throughout (35 files)". With Material gone that rationale
is void. The nav stays hand-rolled and keeps its M3 _geometry_ (80px bar, 64×32 pill indicator) — it
is good design and newly built — but sources its colours from shadcn/Tailwind semantic tokens instead
of `--mat-sys-*`. The 2-destination deviation and its reasoning carry over untouched.

Styling: Tailwind utilities for layout/spacing; shadcn CSS variables fed by `src/styles/tokens.css`.
Dark mode stays one attribute (`data-theme`); no per-component `dark:`, no raw hex.

## Decomposition

23k lines across ~30 pages is far past one plan. **Each sub-project gets its own spec → plan →
implementation cycle.**

This document is the **architectural spine for all ten phases** — the stack, structure, DI, store, and
MVVM decisions above bind every one of them. It scopes **P0 in implementable detail**; P1–P9 are sized
and sequenced here but each earns its own spec before work starts, informed by what P0 and P1 learn.

| #      | Scope                                                                                                                                                                                | Done when                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **P0** | Foundation: delete `legacy-react/` + Angular tree; scaffold; composition root + `ServicesProvider`; store base + `useStore`; copy domain/model/commands; router shell; one real page | Tests green, app boots, one route renders live RxDB data |
| **P1** | Decks: library, tree, detail, questions, settings, content editor. Includes the **never-ported deck-tree drag-and-drop**                                                             | Parity vs `main`; all three VM hooks land                |
| **P2** | Practice: quiz, match (machines already ported + tested)                                                                                                                             | Parity vs `main`                                         |
| **P3** | Study — **never reached Angular**                                                                                                                                                    | Parity vs `main`                                         |
| **P4** | Auth: login, signup, forgot, welcome, threshold — **pages never reached Angular** (stores/commands did)                                                                              | Parity vs `main`                                         |
| **P5** | Profile, streak, badges, achievements — **never reached Angular**                                                                                                                    | Parity vs `main`                                         |
| **P6** | Settings subpages: profile, password, privacy, help, about — **never reached Angular** (hub + 2 editors did)                                                                         | Parity vs `main`                                         |
| **P7** | Notifications                                                                                                                                                                        | Parity vs `main`                                         |
| **P8** | Import (paste notes, Anki) — **gated off in Angular**                                                                                                                                | Parity vs `main`                                         |
| **P9** | Teardown: retire both worktrees, reconcile ADRs, rewrite CLAUDE.md + `docs/CODE_STYLE.md`                                                                                            | All areas at parity                                      |

**P0 → P1 is the critical path.** If the pattern is wrong, P1 is where it shows; everything after is
repetition. P3/P5 are net-new builds, not ports — they carry the most risk of scope surprise.

### Branching

P0 starts a new branch off **`angular-migration`**, not `main` — the branch carries the ≈7,600-line
framework-agnostic core we copy, so the core files can be moved with history intact. Proposed name:
`react-return`.

Because `legacy-react/` is verified byte-identical to `main:src/` and `main` has not moved since the
fork, deleting `legacy-react/` in P0 is information-preserving and needs no further ceremony.

### Parity references

P0 deletes both `legacy-react/` and the Angular tree from the working branch. **Neither reference
lives in the working tree** — both are read from git as frozen, read-only branches:

| Reference          | Branch                                        | Authority                                                          | Runnable?                                                                        |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Original React app | `main` (frozen at `87e68f4`, 0 commits since) | **Behavioural — the parity bar, for every area**                   | **Yes** — `git worktree add ../mindscape-ref main && npm i && npm run dev`       |
| Angular port       | `angular-migration` (frozen at `408267a`)     | **Structural only** — area layout, bulk commands, VM decomposition | Yes — `git worktree add ../mindscape-ng angular-migration && npm i && npm start` |

**`main` is the behavioural bar for every area, including areas Angular already ported.** The Angular
tree is not a behavioural authority, because the port tracker documents deviations from the original
that were never reconciled:

- Sticky-header elevation was simplified to a boolean + CSS transition; the React original ramps 0–1
  over 16px.
- Drag-and-drop reorder/reparent was never ported at all.
- The long-press action sheet on deck/folder/card rows was removed.
- **`[~]` means "ported, _verification pending_"** — most ported rows are `[~]`, not `[x]`, so their
  parity was never established in the first place.

Treating that tree as the bar would canonise unverified behaviour and quietly inherit its regressions.
Its value is structural: it is the reference for _how the code is organised_ — feature areas, bulk
commands, the three VMs — which is exactly the part of the Angular work being kept.

Where the two references disagree on behaviour, **`main` wins and the deviation is noted in that
phase's spec.** If a deviation turns out to be a deliberate improvement worth keeping, it is raised as
a design decision, not smuggled in as a port.

Both worktrees are created once at P0 and retired at P9. This is what makes deleting both trees from
the working branch safe at P0 rather than at the end: the working tree stays clean, and parity remains
observable at any moment.

## ADR churn

| ADR                       | Action                                                       |
| ------------------------- | ------------------------------------------------------------ |
| 0001 styling              | **Rewrite** — Tailwind + shadcn CSS vars fed by `tokens.css` |
| 0002 widget ownership     | **Superseded** by 0012                                       |
| 0003 in-place migration   | **Superseded** by 0010                                       |
| 0004 feature areas        | **Stands**                                                   |
| 0005 platform choices     | **Rewrite** — Transloco→i18next, ngsw→vite-plugin-pwa        |
| 0006 migration mechanics  | **Superseded** by 0010                                       |
| 0007 hand-rolled nav      | **Stands**                                                   |
| 0008 MVVM / no-middle-man | **Reframed** by 0011 (rule survives; VM form changes)        |
| 0009 sheets on PrimeNG    | **Superseded** by 0012                                       |
| **0010**                  | **New** — return to React; the framework-agnostic core       |
| **0011**                  | **New** — MVVM in React: the ViewModel is a hook             |
| **0012**                  | **New** — widget ownership on shadcn                         |

## Risks

- **P3/P5 are builds, not ports.** Study (12 UI files + 8 card faces) and Profile/streak/badges/
  achievements never reached Angular, so there is no prior port to lean on — only the original React.
  Highest estimate risk in the plan, though the runnable `main` worktree substantially de-risks the
  parity question.
- **shadcn is a different design language** to both Material/PrimeNG and the hand-rolled originals.
  Visual parity is explicitly not the bar; behavioural parity is. Expect UI review passes.
- **The 2-of-100 Angular-importing commands** are unexamined; assumed trivial. Verify in P0.
- **Store reactivity granularity.** Angular signals are fine-grained; `useSyncExternalStore` re-renders
  on any store emission. Deck library renders large trees — if this bites, add selector-level
  subscription. Not pre-optimised.

## Verification

Per phase: `npm run typecheck && npm run lint && npm run test`, plus a build. The 18 domain spec files
must stay green from P0 onward — they are the behavioural anchor across the framework change, and the
strongest evidence the core survived the move intact.
