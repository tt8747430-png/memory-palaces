# Design: MVVM extraction, area barrels, and dependency cleanup

**Date:** 2026-07-16
**Status:** Approved — ready for implementation planning
**Branch:** `angular-migration`

## Context

The request was to "refactor the structure to follow Clean Architecture and MVC/MVVM" before resuming
the React→Angular port. Investigation showed the premise needs a correction: **the folder structure
already satisfies Clean Architecture**, per ADR-0004, and the code obeys it.

Verified against the current tree:

- **Domain core** — `shared/domain/` plus each area's `model/`. Pure TypeScript, no Angular, no IO.
- **Ports** — `Repository<T>` (`shared/data/base-repository.ts`), bound via `InjectionToken`s.
- **Adapters** — `rxdb-repository.ts` (production), `in-memory-repository.ts` (tests).
- **Composition root** — `data.providers.ts` wires adapters into ports through DI.
- **CQRS-lite** — one use-case per file under each area's `commands/`.

A dependency-rule scan found **zero violations**: `shared/` imports nothing from feature areas, RxDB
never leaks outside the data layer (only schema type-imports), and no component touches a repository
directly. A folder restructure would churn ~200 files and buy nothing.

The real defects sit one layer down, in the component layer, and in the dependency list.

## Non-goals

- **No folder restructure.** ADR-0004 stands. `src/app/<area>/{model,data,commands,pages,ui}` is kept.
- **No new UI library.** See "Bottom navigation" below.
- **No changes to persisted RxDB schemas.** Nothing here touches stored data or needs a migration.
- **No behavior change — with one deliberate exception.** Every item is a behavior-preserving refactor
  _except_ the bottom navigation, which intentionally changes appearance: it moves from Taiga's design
  language to the Material 3 navigation bar spec. See "Bottom navigation".
- **No navigation IA change.** The tab set stays Home + Profile. Study and Practice are deck-scoped
  flows, not destinations, and cannot become tabs (see "Destination count").

---

## Part 1 — Dependency cleanup

### Finding: a 36 MB dependency for one component

`@taiga-ui` is 36 MB across 12 packages, and the entire suite backs exactly one component: the bottom
navigation (`TuiTabBar` in `shell/app-nav.ts`). The only other Taiga references are `TuiRoot` /
`provideTaiga`, and `TuiRoot` exists solely to host Taiga components — so removing the tab bar makes
the whole dependency dead. It also carries a global LESS theme and an icon-asset copy step in
`angular.json`, which is the only reason `less` is a devDependency.

Two further package groups have **zero references** anywhere in `src/` or configs (`.ts`, `.html`,
`.css`, JSON):

| Package group    | Count | Size   | Real usage                |
| ---------------- | ----- | ------ | ------------------------- |
| `@taiga-ui/*`    | 12    | 36 MB  | 1 component (`TuiTabBar`) |
| `@maskito/*`     | 4     | 2.0 MB | none                      |
| `@ng-web-apis/*` | 6     | 308 KB | none                      |

**Correction, found during implementation:** `@maskito` and `@ng-web-apis` are not _independent_ dead
deps — they are **Taiga's own dependency footprint**, hoisted into `package.json`. `@taiga-ui/cdk`
imports `@ng-web-apis/common`, and Taiga and Maskito share a maintainer. Removing them before Taiga
breaks the build. They are unreferenced by _our_ code but only become removable once Taiga goes, so
they are part of one removal, not three. Order: Taiga first.

### Decision

Remove all 22 packages plus the `less` devDependency.

**Removals:**

- `package.json` — 12 `@taiga-ui/*`, 4 `@maskito/*`, 6 `@ng-web-apis/*`, `less`.
- `angular.json` — the `@taiga-ui/icons` asset glob and the `taiga-ui-theme.less` entry in `styles`.
- `app.config.ts` — `provideTaiga()` and its import.
- `app.ts` — the `TuiRoot` import and its entry in `imports`.
- `app.html` — the `<tui-root>` wrapper element (a `display:block; height:100%` box; `ms-root` is
  already `position:fixed; inset:0`, so the wrapper is dropped rather than replaced).
- `src/tailwind.css` — the `tui-root { display:block; height:100% }` rule.
- `src/styles.scss` — the entire **`--tui-*` → semantic token bridge** (11 declarations mapping Taiga's
  font/background/text/border tokens to app tokens). Dead once Taiga is gone. Its header comment, which
  names Taiga UI as one of three themed systems, is corrected to Material + PrimeNG.
- `app.spec.ts` — `provideTaiga` import; the assertion `tui-root router-outlet` becomes `router-outlet`,
  and the test name loses "inside tui-root".

**PrimeNG, Angular Material, and lucide-angular are unaffected.** `lucide-angular` is the largest
directory on disk (62 MB) but is imported per-icon across 47 files and tree-shakes to only the glyphs
used; it is not a removal candidate.

### Bottom navigation — hand-rolled to the Material 3 navigation bar spec

**Decision: no library. The nav is implemented by hand, to the M3 navigation bar spec**
(<https://m3.material.io/components/navigation-bar/overview>).

#### Why no library

Re-verified against the installed packages rather than trusting ADR-0002:

- **Angular Material v22.0.4 ships no navigation bar.** Its 38 entry points contain nothing nav-bar
  shaped (`bottom-sheet`, `sidenav`, `tabs`, `toolbar` are the near misses) and there is no
  `MatNavigationBar` symbol anywhere in its typings. Its nav components are `mat-tab-nav-bar` (a top
  tab-group header with ink bar and pagination), `mat-nav-list`, `mat-sidenav`, `mat-toolbar` — none
  is a mobile bottom nav.
- **Material Web has `md-navigation-bar`, but only in `labs/`.** It never graduated to stable and the
  project is in maintenance mode. Adopting it means a new dependency plus a `CUSTOM_ELEMENTS_SCHEMA`
  bridge for a component Google never stabilized — the Taiga mistake repeated.
- **PrimeNG has no equivalent** — `Dock` is a macOS-style dock, `TabMenu` a horizontal tab menu.
- Kendo's `BottomNavigation` is commercially licensed; the standalone libraries are stale (Angular 8/9).

ADR-0002's search conclusion stands: no library ships this. What changes is the response — a widget
whose hard parts are _already hand-written_ does not justify a 36 MB, 12-package dependency.
`app-nav.ts` already owns tab visibility, fixed positioning, z-index, and safe-area padding; Taiga
supplies only glyph styling and two icons. ADR-0002 set this precedent for `SwipeRow`:
_"stays custom — no library ships this."_

#### Why M3 specifically

The app is Material M3 throughout (35 files import `@angular/material`; ADR-0001 styles components via
M3 system variables). The bottom nav is the **one surface not speaking M3** — it renders in Taiga's
design language via a separate `--tui-*` bridge. Building to the M3 spec fixes an existing visual
inconsistency and replaces ad-hoc markup with a documented specification.

Crucially, `styles.scss` **already runs `mat.theme()` and pins the `--mat-sys-*` roles to app tokens**,
so the nav themes off the same tokens as every other component, dark mode included, at no extra cost.

#### The spec (token values from Material Web's reference implementation)

| Element          | Spec                                                                   | Already wired in `styles.scss`?                                 |
| ---------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Container        | height `80px`, color `surface-container`                               | ✅ → `var(--surface-sky)`                                       |
| Active indicator | `32px` × `64px`, `corner-full`, `secondary-container`                  | ⚠️ shape ✅ → `var(--radius-pill)`; color **not pinned**        |
| Icon             | `24px`; active `on-secondary-container`, inactive `on-surface-variant` | ⚠️ inactive ✅ → `var(--text-secondary)`; active **not pinned** |
| Label            | `label-medium`; active `on-surface`, inactive `on-surface-variant`     | ✅ → `var(--text-primary)` / `var(--text-secondary)`            |

**Required theme addition.** `styles.scss` pins `--mat-sys-secondary` and `--mat-sys-on-secondary` but
**not** `--mat-sys-secondary-container` / `--mat-sys-on-secondary-container` — the exact roles the M3
active indicator uses. Unpinned, they fall through to `mat.$azure-palette`'s generated long tail,
putting the pill off the `--sw-*` palette. Both roles get pinned to app tokens in the bridge, which
fixes the gap for **every** Material component reading that role, not just the nav.

They are pinned to `--secondary` / `--secondary-foreground`, which is already a tinted container with
its own ink (light: blue-300 with navy ink; dark: a translucent sky tint with near-white ink) and flips
with the theme. **Not** `--surface-sky`: that is what `surface-container` maps to, so the indicator
would be invisible against the bar it sits on.

#### Implementation

The component keeps its existing structure and `visible()` logic. It swaps `tuiTabBar`/`tuiTabBarItem`
for semantic markup, `@tui.house`/`@tui.user` for lucide `House`/`User` (lucide is already in 47 files,
which also drops the Taiga icon-asset pipeline), and the hardcoded anchors for a tracked `@for` over a
tab array. `routerLinkActive` supplies active styling and `ariaCurrentWhenActive` supplies
`aria-current="page"`. The `80px` container sits above the safe-area inset (`pb-safe`), per
`docs/MOBILE_DESIGN.md`. Colors reference `--mat-sys-*` roles, which resolve to `--sw-*` semantic
tokens — no raw hex, no per-component `dark:`.

**This is a deliberate visual change**, the one exception to the no-behavior-change rule: the bar
becomes 80px tall with an M3 pill active indicator instead of Taiga's styling.

#### Destination count — a recorded deviation

M3 specifies the navigation bar for **3–5 destinations**. The app has **2** (`home`, `profile`). This
deviation is accepted and recorded rather than designed around:

- **Study and Practice cannot become destinations.** They are deck-scoped flows —
  `/decks/:deckId/study`, `/decks/:deckId/quiz`, `/decks/:deckId/match`. There is no deck-less entry
  point; both are entered _from_ a deck. The `study/` area has no pages at all — it is the SRS engine
  (`session-machine`, `grade-card`, `scope`, progress/XP). Promoting them would require inventing
  deck-picker pages the product does not have.
- **The 2-tab IA is deliberate:** Home (your content) vs Profile (you). Notifications reach via the
  home-header bell; settings and the progress pages via profile. Everything else is correctly
  subordinate to one of the two.
- **The progress area is entirely unported** — no `src/app/progress/` exists — so a third "Progress"
  tab is not available to build today.

Adding destinations purely to satisfy a destination count would let the guidance wag the product. The
3–5 range exists to keep bars legible; two clear peers are legible. Building to spec means a third tab
later is one array entry.

This **supersedes the bottom-nav row of ADR-0002**, recorded in ADR-0007.

---

## Part 2 — MVVM extraction

### Finding: the View and ViewModel are fused

`deck-library-page.ts` is 688 lines. It is a View that is simultaneously its own ViewModel and a
controller: it injects 8 stores, owns view state, derives read models (`selectableIds`, `allFavorited`,
`filedDecks`, `isEmpty`), and orchestrates bulk archive/favorite/duplicate/unfile/move/delete with
toasts, undo, dialogs, and navigation interleaved. `deck-questions-page.ts` (500),
`deck-content-editor.ts` (485), `quiz-session.ts` (473) and `settings-swipe-page.ts` (389) share the
shape. None of this is testable without mounting a component and 8 stores.

### Decision: ViewModel shape

A ViewModel is an `@Injectable()` class provided at component level:

```ts
@Component({ ..., providers: [DeckLibraryVm] })
export class DeckLibraryPage {
  protected readonly vm = inject(DeckLibraryVm)
}
```

This keeps DI (the VM injects stores, router, and real services), scopes one instance per component,
gives `DestroyRef` for cleanup, and is testable through `TestBed` without rendering.

The VM owns: view state signals, derived read models (`computed`), and orchestration (command dispatch,
toast/undo composition, confirm flows). The component owns: the template, and nothing else.

### Decision: no middle men

Two rules, both load-bearing:

**1. The VM injects real services, never pass-through wrappers.**

`ToastService`, `ConfirmDialog`, `PromptSheet`, and `ActionSheet` already exist as promise-returning
services that do real work — injecting them into a VM is correct, not indirection. A per-sheet wrapper
class (e.g. `MoveDeckSheetService` forwarding to `MatBottomSheet.open()`) would be a textbook Middle
Man and is rejected.

`MoveDeckSheet` and `FolderSheet` are the outliers: they are opened raw via `MatBottomSheet` with
`.afterDismissed().subscribe()` callbacks. They get the same promise-returning open API the other
three sheets already have, **co-located in their own files** — the sheet's own public API, not a new
class:

```ts
// move-deck-sheet.ts — alongside the component it opens
export function openMoveDeckSheet(
  sheets: MatBottomSheet,
  data: MoveDeckSheetData,
): Promise<MoveDeckResult | undefined>
```

This makes two outliers consistent with an existing, working pattern, removes callback nesting, and
keeps the VM from naming a View component.

**2. Not every page gets a ViewModel.**

A blanket VM-per-page would manufacture the exact smell being avoided — a class that only forwards to
stores and commands. The rule:

> Extract a ViewModel only when a page owns **real** derived state or multi-step orchestration.
> A class that merely forwards to stores and commands is a Middle Man — delete it and let the
> component read the store directly.

Pages that earn a VM (real derived state + orchestration):

- `decks/pages/deck-library-page.ts` (688)
- `decks/pages/deck-questions-page.ts` (500)
- `decks/ui/deck-content-editor.ts` (485)
- `practice/ui/quiz-session.ts` (473)
- `settings/pages/settings-swipe-page.ts` (389)
- `settings/pages/settings-select-page.ts` (332)

Pages that stay plain components: `archived-decks-page`, `card-editor-page`, `deck-settings-page`,
`question-editor-page`, `settings-page`, `notifications-page`, and the auth pages. Each is re-checked
against the rule during implementation rather than assumed.

### Decision: domain rules move into commands

Rules currently decided in the page belong in use-cases:

- `canReparent` filtering and the "favorite is a set, not a flip" semantics
  (`deck-library-page.ts:342-369`) move into commands.
- Bulk actions currently loop N command calls from the page
  (`ids.forEach(id => void setDeckArchived(...))`), producing N separate RxDB writes. They become real
  bulk use-cases — `archiveDecks(store, ids)`, `favoriteDecks(store, ids)`, `moveDecks(store, ids, dest)`,
  `duplicateDecks(...)`, `unfileDecks(...)`, `deleteDecks(...)` — each one command call from the VM.

The VM orchestrates; it does not decide domain rules.

### Decision: store bootstrap moves to the composition root

`deck-library-page.ts:111-119` calls `.start()` on seven `providedIn: 'root'` stores from a page
constructor. Every page must remember this; forgetting one means reads silently return empty.

`CollectionStore.start()` is already idempotent (`if (this.unsubscribe) return`), so moving these calls
is **behavior-neutral**. They move into a `provideEnvironmentInitializer` in `data.providers.ts` — the
composition root, where wiring already lives. Stores subscribe once at bootstrap; pages only read.

This is not a middle man: it deletes seven lines from every page constructor and adds one explicit
wiring block in the file that already owns wiring.

### Decision: area barrels

No feature area has an `index.ts`, so pages deep-import other areas' internals — `deck-library-page.ts`
alone reaches into `@app/auth/data/stores`, `@app/notifications/data/notification-store`,
`@app/settings/data/preferences-store`, and `@app/study/data/progress-store`. This is the one Clean
Architecture boundary that is genuinely weak: areas have no public API.

Each area (`decks`, `study`, `practice`, `auth`, `settings`, `notifications`, `import`) gets an
`index.ts` exporting its stores, commands, and public types. Cross-area imports go through the barrel;
intra-area imports keep using relative paths. Barrels export only what other areas actually consume —
a barrel re-exporting an area's entire internals is its own kind of middle man.

---

## Part 3 — Documentation

`CLAUDE.md` currently documents the **React FSD architecture** end to end — Zustand store factories,
`useXStore()` hooks, `features/`, `entities/`, `widgets/`, `eslint-plugin-boundaries`, Vite commands.
None of it describes the Angular app. ADR-0004 flagged this rewrite as required migration work; it is
now actively misleading.

**Rewrite `CLAUDE.md`** to describe the Angular architecture, and record as explicit rules:

- The Clean Architecture layering as it actually exists (domain / ports / adapters / composition root).
- MVVM: component-provided `@Injectable()` VM; View owns the template only.
- **The no-middle-man rule**, stated as a rule with its test (see Part 2).
- The VM extraction threshold — VMs are earned, not automatic.
- Writes through commands, reads through store signals.
- Cross-area imports through barrels only.
- Angular commands (`ng serve`/`ng build`/`ng test`/`ng lint`), replacing the Vite/Vitest-npm set.

**New ADRs:**

- **ADR-0007 — Bottom navigation is hand-rolled to the M3 spec; Taiga UI removed.** Supersedes the
  bottom-nav row of ADR-0002. Records: (a) the ADR-0002 library search re-verified and still accurate —
  Angular Material v22 ships no navigation bar, Material Web's is labs-only, PrimeNG has no equivalent;
  (b) the conclusion changed because a widget whose hard parts are already hand-written does not justify
  a 36 MB, 12-package dependency; (c) the nav follows the **M3 navigation bar spec**, themed via the
  `--mat-sys-*` roles the app already bridges, making it consistent with the rest of the app for the
  first time; (d) the **2-destination deviation** from M3's 3–5 guidance, with the reasoning that Study
  and Practice are deck-scoped flows and cannot be destinations.
- **ADR-0008 — MVVM boundary and the no-middle-man rule.** Records the VM shape, the extraction
  threshold, the co-located sheet-open API over wrapper services, and store bootstrap at the
  composition root.

ADR-0002's matrix is updated in place to mark the bottom-nav row superseded, and to note that Taiga UI
is no longer a foundation (leaving Material/CDK + PrimeNG + Tailwind, per ADR-0001).

`.scratch/angular-migration/port-tracker.md` gets a note that `AppNav.tsx`'s Angular equivalent no
longer depends on Taiga.

---

## Testing

- **New VM specs** — each extracted VM gets a colocated `*.vm.spec.ts` covering its derived read models
  and orchestration, driven through `TestBed` with the in-memory repository bound to the port tokens.
  This is the payoff: `selectableIds`, `allFavorited`, `filedDecks`, and the bulk flows become testable
  without rendering.
- **New bulk-command specs** — colocated with the commands, following the existing
  `folder-commands.spec.ts` shape.
- **Existing specs stay green.** `app.spec.ts` updates for the removed `tui-root` wrapper. No other
  spec should need changing — if one does, that signals unintended behavior change.
- **`app-nav`** gets a spec asserting tab visibility on the two tab routes, hidden elsewhere, and
  `aria-current="page"` on the active tab. Visual conformance to the M3 spec (80px container, 32×64
  pill) is verified manually, not asserted in a unit test — pinning pixel values in jsdom tests the
  stylesheet, not the behavior.

## Verification

`npm run typecheck && npm run lint && npm run test` must pass, plus `npm run build` — the build is the
real check that Taiga's LESS theme and icon assets are cleanly removed from `angular.json`. A
production build also confirms the bundle shrank rather than merely relocating.

Manual check (the nav is the one deliberate visual change, so it is verified by eye):

- Renders on home and profile, hides on every other route.
- M3 conformance: 80px container, 32×64 pill indicator on the active destination, 24px icons.
- The pill reads as an app-palette color, not a Material-generated azure — i.e. the pinned
  `secondary-container` role took effect.
- Correct in **both** light and dark (`data-theme="dark"`), since the whole point of routing through
  `--mat-sys-*` is that dark mode flips for free.
- Safe-area padding intact on a notched viewport; touch targets ≥ 44px.

## Sequencing

Landing as **one refactor commit** (owner's decision), with typecheck/lint/test/build green before it
is written. Internal work order:

1. Dead deps + Taiga removal + hand-rolled nav.
2. Bulk commands + store bootstrap at the composition root.
3. Area barrels.
4. VM extraction, area by area.
5. `CLAUDE.md` rewrite + ADR-0007/0008 + ADR-0002 update.

## Risks

- **One commit means a large diff.** Mitigated by keeping every step behavior-preserving and verifying
  before commit; the work order above is still followed internally so a bisect target can be
  reconstructed if needed.
- **VM extraction could silently change behavior** in the bulk flows, which are the least
  test-covered code being touched. Mitigated by writing the VM specs as part of the extraction, not
  after.
- **Removing `@maskito`** — currently unused, but it is an input-masking library and some unported
  page may have been expected to use it. If an upcoming port needs masking it can be reinstalled; a
  zero-import dependency is not carried on speculation.
- **Pinning `secondary-container` has blast radius beyond the nav.** Any Material component already
  reading that role picks up the new value. That is the intent — the role should have been pinned all
  along, per the bridge's own stated purpose — but the theme is checked in light and dark after the
  change rather than assumed.
- **The nav's visual change is intentional and should be reviewed as a design change**, not waved
  through as refactor noise. If the M3 bar is not wanted on sight, the fallback is a minimal 2-tab bar
  with no pill indicator; the dependency removal stands either way and does not depend on this choice.
