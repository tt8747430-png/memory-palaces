# ADR-0008: The MVVM boundary, and the no-middle-man rule

**Status:** Accepted
**Date:** 2026-07-16
**Amended:** 2026-07-18 — re-expressed in React terms after ADR-0013 (the Angular revert). The
boundary and the no-middle-man rule are unchanged; only the ViewModel's _mechanism_ changed, from an
`@Injectable()` class to a hook.

**Context:** ADR-0004 settled the folder architecture (feature areas over FSD) and the Clean
Architecture layering — domain core, repository ports, adapters, a composition root, CQRS-lite
commands. An audit found the code obeys all of it: zero dependency-rule violations, `shared/` imports
nothing from feature areas, RxDB never leaks past the data layer, no component touches a repository.

The defect was one layer down. The deck library page had grown to **688 lines**: a View that was also
its own ViewModel and a controller. It read 8 stores, owned view state, derived read models
(`selectableIds`, `allFavorited`, `filedDecks`, `isEmpty`), and orchestrated bulk
archive/favourite/duplicate/unfile/move/delete with toasts, undo, dialogs, and navigation
interleaved. None of it was reachable in a test without mounting a component and 8 stores.

## Decision

### The ViewModel

A ViewModel is a **hook**, co-located with its page and named `use<Page>`:

```tsx
// deck-library-page.tsx
export function DeckLibraryPage() {
  const vm = useDeckLibrary()
  // …template only
}
```

It reaches the model layer through `useServices()` (`shell/services-provider.tsx`) and binds store
observables with `useStore()`. It is testable with `renderHook` — no page render, no DOM.

- **The ViewModel owns:** view state, derived read models (`useMemo`), and orchestration — command
  dispatch, toast/undo composition, confirm flows, navigation intents.
- **The View owns:** the JSX. Plus presentation that never leaves it — the icon set, and state like
  scroll-driven header elevation that no other layer can observe.

Navigation is exposed as intents (`openProfile()`, `openDeck(id)`), so JSX never carries route
strings.

### No middle men

Two rules, both load-bearing.

**1. The ViewModel calls real services, never pass-through wrappers.**

`toast` (sonner), `openConfirmDialog`, `openPromptDrawer`, and `openActionDrawer` do real work;
calling them from a VM is correct, not indirection. A per-drawer wrapper module — e.g. a
`moveDeckDrawerService` that only forwards to the overlay host — is a textbook Middle Man and is
rejected.

Drawers that return data expose **their own promise-returning open function, co-located in the
drawer's own file**:

```ts
// move-deck-drawer.tsx, beside the component it opens
export function openMoveDeckDrawer(data: MoveDeckDrawerData): Promise<MoveDestination | undefined>
```

This is not a new layer — it is the drawer's public API. It keeps callback nesting out of the VM and
keeps the VM from naming a View component.

**2. ViewModels are earned, not automatic.**

> Extract a ViewModel only when a page owns **real** derived state or multi-step orchestration.
> A hook that merely forwards to stores and commands is a Middle Man — delete it and let the
> component read the store directly.

A blanket VM-per-page would manufacture the exact smell being avoided. Most pages stay plain
components that call `useStore()` directly.

**Judge by the logic, not by file size.** Most of a large page file is JSX. The rule's real test is
whether the orchestration exists at all:

| Shape                                                                                                                    | Verdict                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Page owns bulk flows over multiple stores, with toasts/undo/confirms                                                     | **VM** — `use-deck-library` (878 lines) behind a 521-line View |
| Page projects one already-tested reducer and renders it                                                                  | no VM — the state lives in the tested reducer                  |
| Page delegates its rules to tested pure functions (`normalizeSwipeConfig`, `normalizeSelectToolbar` in `shared/config/`) | no VM — a working copy and one `save()` is not orchestration   |

**If the domain logic is already extracted and tested, a ViewModel has nothing to hold.**

### Domain rules belong in commands

Rules the page was deciding moved into bulk use-cases — `setDecksArchived`, `setDecksFavorite`,
`moveDecks`, `duplicateDecks`, `deleteDecks`, `deleteFolders`:

- "Favourite is a set, not a flip" (a mixed selection favourites everything; only an all-favourited
  selection clears) lives in `setDecksFavorite`, which returns the value it applied so callers report
  the outcome without re-deriving the rule.
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

Pages were calling `.start()` on stores from their own lifecycles — 34 calls across 13 pages. Every
page had to remember; forgetting one meant reads silently returned empty, and one store was mounted
_solely_ to be started.

Stores now subscribe once in `composition-root.ts`'s `startAll()`, where wiring already lives.
`start()` is idempotent, so this was behaviour-neutral. `SessionStore` is excluded by design: auth
state is loaded once by `restoreSession`, not mirrored from a live query.

**Never call `start()` from a component.** Unit tests arrange the precondition themselves
(`createTestServices()` deliberately does not start stores).

### Cross-area imports go through barrels

Each feature area exposes an `index.ts` — its public API. Cross-area imports use it; intra-area
imports stay relative. Barrels export only what other areas actually consume; a barrel re-exporting
an area's internals is its own kind of middle man.

## Consequences

- The deck library's read models and bulk flows are unit-testable without rendering — the payoff,
  since the bulk flows were the least-covered code in the app.
- One more indirection to traverse when reading a page: JSX → VM hook → command. Accepted; the
  alternative was one component that was three things at once.
- The extraction threshold means the codebase has **both** shapes — pages with VMs and pages without.
  That is intentional. Uniformity here would mean manufacturing middle men for the sake of symmetry.
