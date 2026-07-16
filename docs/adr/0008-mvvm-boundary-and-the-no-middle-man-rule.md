# ADR-0008: The MVVM boundary, and the no-middle-man rule

**Status:** Accepted
**Date:** 2026-07-16
**Context:** ADR-0004 settled the folder architecture (feature areas over FSD) and the Clean
Architecture layering — domain core, repository ports, adapters, a composition root, CQRS-lite
commands. An audit found the code obeys all of it: zero dependency-rule violations, `shared/` imports
nothing from feature areas, RxDB never leaks past the data layer, no component touches a repository.

The defect was one layer down. `deck-library-page.ts` had grown to **688 lines**: a View that was also
its own ViewModel and a controller. It injected 8 stores, owned view state, derived read models
(`selectableIds`, `allFavorited`, `filedDecks`, `isEmpty`), and orchestrated bulk
archive/favourite/duplicate/unfile/move/delete with toasts, undo, dialogs, and navigation interleaved.
None of it was reachable in a test without mounting a component and 8 stores.

## Decision

### The ViewModel

A ViewModel is an `@Injectable()` class provided **by the component**:

```ts
@Component({ providers: [DeckLibraryVm], templateUrl: './deck-library-page.html' })
export class DeckLibraryPage {
  protected readonly vm = inject(DeckLibraryVm)
}
```

It keeps DI (the VM injects stores, router, and real services), scopes one instance per component,
and is reachable through `TestBed` without rendering.

- **The ViewModel owns:** view state signals, derived read models (`computed`), and orchestration —
  command dispatch, toast/undo composition, confirm flows, navigation intents.
- **The View owns:** the template. Plus presentation that never leaves it — the icon set, and state
  like scroll-driven header elevation that no other layer can observe.

Navigation is exposed as intents (`openProfile()`, `openDeck(id)`), so templates never carry route
strings.

### No middle men

Two rules, both load-bearing.

**1. The ViewModel injects real services, never pass-through wrappers.**

`ToastService`, `ConfirmDialog`, `PromptSheet`, and `ActionSheet` are promise-returning services that
do real work; injecting them into a VM is correct, not indirection. A per-sheet wrapper class — e.g.
a `MoveDeckSheetService` forwarding to `MatBottomSheet.open()` — is a textbook Middle Man and is
rejected.

Sheets that return data expose **their own promise-returning open function, co-located in their own
file**, matching the shape `ConfirmDialog.confirm()` and `PromptSheet.prompt()` already had:

```ts
// move-deck-sheet.ts, beside the component it opens
export function openMoveDeckSheet(
  sheets: MatBottomSheet,
  data: MoveDeckSheetData,
): Promise<MoveDeckResult | undefined>
```

This is not a new layer — it is the sheet's public API. It removed the `.afterDismissed().subscribe()`
callback nesting and keeps the VM from naming a View component.

**2. ViewModels are earned, not automatic.**

> Extract a ViewModel only when a page owns **real** derived state or multi-step orchestration.
> A class that merely forwards to stores and commands is a Middle Man — delete it and let the
> component read the store directly.

A blanket VM-per-page would manufacture the exact smell being avoided. Most pages stay plain
components.

**Judge by class body and by whether the logic is real — never by file size.** Applying the rule to
this codebase, six components looked like candidates by file length; only three earned a VM:

| Component              | File | Class body | VM?                |
| ---------------------- | ---- | ---------- | ------------------ |
| `deck-library-page`    | 688  | ~580       | **yes** → 53 lines |
| `deck-questions-page`  | 500  | ~275       | **yes**            |
| `deck-content-editor`  | 484  | 273        | **yes**            |
| `quiz-session`         | 473  | 146        | no                 |
| `settings-swipe-page`  | 385  | 129        | no                 |
| `settings-select-page` | 328  | 114        | no                 |

The rejections show the rule doing work. `quiz-session` injects no store and dispatches no command:
its state already lives in the unit-tested `quizReducer`, and what remains is projection over
`state()` plus presentation. The two settings editors are the same — their real rules
(`normalizeSwipeConfig`, `normalizeSelectToolbar`) already live tested in `shared/config/`, leaving a
working copy, constant lookups, and one `save()`. Their class bodies are also _smaller_ than
`deck-settings-page` (135), which stays plain; extracting them would be symmetry, not design.

**If the domain logic is already extracted and tested, a ViewModel has nothing to hold.**

### Domain rules belong in commands

Rules the page was deciding moved into bulk use-cases — `setDecksArchived`, `setDecksFavorite`,
`moveDecks`, `duplicateDecks`, `deleteDecks`, `deleteFolders`:

- "Favourite is a set, not a flip" (a mixed selection favourites everything; only an all-favourited
  selection clears) now lives in `setDecksFavorite`, which returns the value it applied so callers
  report the outcome without re-deriving the rule.
- `canReparent` filtering lives in `moveDecks`, which skips impossible destinations rather than
  throwing and abandoning the rest of a selection, and returns the ids actually moved.

The VM orchestrates; it does not decide domain rules.

The bulk commands also fixed real defects the page's `ids.forEach(...)` loops carried: overlapping
subtrees are unioned before writing (selecting a parent _and_ its child no longer writes the child
twice), and moves run in sequence because each derives its `order` from the destination's current
siblings.

**"Unfile" is deliberately not a command** — it is `moveDecks(store, ids, null, null)`. A separate
`unfileDecks` would forward and nothing else.

### Store bootstrap belongs at the composition root

Pages were calling `.start()` on `providedIn: 'root'` stores from their constructors — 34 calls across
13 pages. Every page had to remember; forgetting one meant reads silently returned empty, and one
store (`PreferencesStore` in `deck-detail-page`) was injected _solely_ to be started.

Stores now subscribe once via `provideEnvironmentInitializer` in `data.providers.ts` — the composition
root, where wiring already lives. `start()` was already idempotent, so this was behaviour-neutral.
`SessionStore` is excluded by design: auth state is loaded once by `restoreSession`, not mirrored from
a live query.

Unit tests arrange the precondition themselves (`store.start()`), since they do not boot the app.

### Cross-area imports go through barrels

Each feature area exposes an `index.ts` — its public API. Cross-area imports use it; intra-area
imports stay relative. Barrels export only what other areas actually consume; a barrel re-exporting an
area's internals is its own kind of middle man.

## Consequences

- `deck-library-page.ts`: **688 lines → 53**. Its read models and bulk flows are unit-testable without
  rendering — the payoff, since the bulk flows were the least-covered code in the app.
- One more indirection to traverse when reading a page: template → VM → command. Accepted; the
  alternative was a 688-line class that was three things at once.
- The extraction threshold means the codebase has **both** shapes — pages with VMs and pages without.
  That is intentional. Uniformity here would mean manufacturing middle men for the sake of symmetry.
