# ADR 0010 — Large decks open in constant time: data keeps its identity, a long list is a window

- **Status:** accepted · **Date:** 2026-09 · consolidated 2026-10

The implementation is `RxdbRepository.observe` (`shared/api/rxdb/rxdb-repository.ts`), `createCollectionStore`
(`shared/lib/entity-store.ts`), `InMemoryRepository`, and `widgets/content-editor`'s `useListWindow` and
`ReorderableList`.

## Context

Opening a deck of 1,000 cards took about 1.8 s in jsdom on a desktop CPU, several times that on a phone, and grew
with the deck. A probe with a React `Profiler` found the causes: every card was mounted; a row was heavy (a swipe
binding, four motion values, two trays, an entrance animation); the page rendered twice on open because the visible
ids reached `useMultiSelect` through an effect; no row was memoized; and every write re-cloned every document
(`toMutableJSON()` per emission), so no memo anywhere could hold.

## Decision

- **An unchanged entity is the same object across emissions.** `RxdbRepository.observe` caches the plain object per
  `RxDocument` in a `WeakMap`; RxDB hands back the same document for an unchanged revision. `createCollectionStore`
  remembers each `complete` repair per incoming object. `InMemoryRepository` keeps identity too and deep-freezes what
  it holds, so editing an entity in place fails a test. `shared/test/repository-contract.ts` holds both adapters to it.
- **A long list is a window.** `ReorderableList` draws only the rows in view (`useListWindow`, on
  `@tanstack/react-virtual`), scrolling `AppScreen`'s own `<main>` (published through `ScreenScrollContext`). The
  window lives in `content-editor`, not `shared/lib`, so the virtualizer loads with the deck screens rather than on
  first paint. Reorder still works ([ADR 0001](0001-drag-and-drop-and-card-stacks.md)).
- **A row is cheap and stable.** Rows are memoized and their callbacks take an id and stay stable for the life of the
  list (`useStableHandlers`). Positions are a `Map` from id, built once per sort. A row has no mount animation. A swipe
  row mounts its trays only once a swipe starts moving.
- **One render on open.** `useMultiSelect({ visibleIds })` takes the ids as an input. The deck page derives the card
  list once (`useCardList`) and hands it down.

## Consequences

- Never edit an entity in place, and never map a whole collection to fresh objects on read.
- A row's entrance animation would replay on every scroll, so lists animate nothing on mount.
- Measured after the change: 1,000 cards open in 26 ms, 5,000 in 25 ms; editing one card costs about 10 ms; 13 rows
  are mounted whatever the deck's size.
- Library due badges are linear: `dueCountsPerDeck` builds the deck map once and memoizes each chain.

## History

- Every card mounted, with a `motion` entrance per row and a deep copy of the collection on every write (replaced
  2026-09).
