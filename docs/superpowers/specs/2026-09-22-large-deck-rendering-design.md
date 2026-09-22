# Large decks open in constant time

_2026-09-22_

Opening a deck of 1,000 cards took ~1.8 s in jsdom on a desktop CPU (several times that on a phone),
and cost grew linearly with the deck. Editing one card re-rendered every row. This spec fixes the
causes, not the symptom.

## Measured causes

A throwaway probe rendered `DeckDetailPage` with the real stores and a React `Profiler`:

| Cards | Open (wall) | Mount commit | Second commit after mount | One card edited |
| ----- | ----------- | ------------ | ------------------------- | --------------- |
| 200   | 484 ms      | 257 ms       | 62 ms                     | 104 ms          |
| 1000  | 1,842 ms    | 776 ms       | 322 ms                    | 541 ms          |

1. **Every card is mounted.** Nothing in the app is virtualized.
2. **A row is heavy.** `SwipeRow` (a `useDrag` binding, four motion values, two tray `motion.div`s,
   one `motion.span` per tray button) is about half the mount cost; the row's own `motion.div`
   entrance animation is a third of what is left. 1,000 rows put 3,002 animated nodes on screen.
3. **The page renders twice on open.** `DeckContentEditor` (and the Library and Questions pages)
   push the visible ids into `useMultiSelect` from an effect. The ids start empty, so the first
   effect always sets state and the whole page renders again.
4. **Any change re-renders every row.** No row is memoized, every handler is a fresh closure, and
   `index={sortedCards.indexOf(card)}` is quadratic.
5. **Every write re-clones every document.** `RxdbRepository.observe` maps each emission through
   `toMutableJSON()`, so flagging one card deep-copies the whole collection and hands every
   subscriber new objects — no memo anywhere can hold.
6. **Library badges are cards × decks.** `dueCountsPerDeck` calls `deckPath`, which builds a map of
   every deck, once per card.

## Shape

### Data keeps its identity

`RxdbRepository.observe` caches the plain object per `RxDocument` (`WeakMap`). RxDB hands back the
same document instance for a revision that has not changed and a new one when it has, so an
unchanged card is the same object across emissions and a changed one is a new object.

`createCollectionStore` remembers each `complete` repair per incoming object, so an untouched deck
stays the same object through its read-side repair too. `InMemoryRepository` — the test double and
the live `session` store — keeps the same identity, and deep-freezes what it holds: identity is only
safe if nothing edits an entity in place, and a frozen entity turns that mistake into a failing test.
The repository contract (`shared/test/repository-contract.ts`) holds both adapters to it.

### One render on open

`useMultiSelect` takes the visible ids as an input — `useMultiSelect({ visibleIds })` — instead of
being told them by an effect. `allSelected` and `toggleAll` read the argument. `setVisibleIds` is
deleted with its three effects.

On the deck page the selection lives in the page but the visible cards were derived in the editor
below it — which is why they had to travel up. `content-editor`'s `useCardList` derives the list once
for the screen (subtree, sort, search, filter, positions, options, maturity, and its own `sort` and
`algorithm`); the page calls it, feeds `visibleIds` to the selection and hands the list to
`DeckContentEditor`, which takes `list` in place of `deckId`, `searchQuery`, `sort` and `algorithm`.
The page also stops computing the subtree a second time for its overview.

### A window, not a list

`ReorderableList` becomes virtual in both modes, on `@tanstack/react-virtual` (`useVirtualizer`):

- The scroll element is `AppScreen`'s own `<main>`, published through a new
  `ScreenScrollContext` (state, not a ref, so the list re-renders once the element exists).
- The window is `content-editor`'s `useListWindow`, not a `shared/lib` export: `shared/lib` is on the
  first paint, and the virtualizer should load with the deck screens.
- The list is not at the top of the scroll content, so `scrollMargin` is the list's offset inside
  it, measured on every render of the list and whenever the scroll content resizes.
- Rows are measured (`measureElement`), with an estimate per list; `gap` replaces the column gap.
- **Reorder keeps working.** `SortableContext` still holds every id; only rendered rows register
  as droppables, and `DndContext`'s auto-scroll mounts more as a drag nears an edge. A
  `rangeExtractor` keeps the dragged row mounted so the drag never loses its node.
- `overscan` covers a fling; nothing is animated on mount, so a row mounting mid-scroll is simply
  there.

### A row is cheap and stable

- Rows are `memo`ized. Their callbacks take an id and are stable for the life of the list
  (`useStableHandlers`), so a row re-renders only when its own card, index or selection changes.
  `useCardActions` builds on the same helper and keeps its identity until what it *offers* changes.
- In select mode a row is also handed its drag handle; `SortableRow` memoizes it (dnd-kit keeps its
  attributes and listeners stable), so arranging does not re-render every row either.
- Index is a `Map` from id (`positionsById`), built once per sort.
- The row's entrance animation goes. It decorated a list opening and cannot survive virtualization
  (it would replay on every scroll); its `exit` never ran, as nothing wrapped the rows in
  `AnimatePresence`.
- `SwipeRow` mounts its trays only once a swipe starts moving, and `TrayButton`'s armed pop is a
  CSS scale transition (`motion-reduce` honoured) instead of a `motion.span` per button.

### Library badges are linear

`dueCountsPerDeck` builds the id map once and memoizes each deck's chain; the archived check is
per deck, not per card.

## Testing

- Repository: an emission after one document changes keeps every other document's object.
- `useMultiSelect`: `allSelected` / `toggleAll` follow the ids it is given; no effect needed.
- `ReorderableList`: renders a window of a long list (not every row), and every row of a short
  one; keeps the dragged row mounted.
- Rows: a memoized row does not re-render when another card changes.
- `dueCountsPerDeck`: unchanged results.
- The probe re-run afterwards, then deleted.

## Result

The same probe after the change (jsdom, desktop CPU; a phone is slower, but no longer by deck size):

| Cards | Open, before → after | One card edited, before → after | Rows mounted |
| ----- | -------------------- | ------------------------------- | ------------ |
| 200   | 484 → 65 ms¹         | 104 → 9 ms                      | 13           |
| 1000  | 1,842 → 26 ms        | 541 → 12 ms                     | 13           |
| 5000  | — → 25 ms            | — → 9 ms                        | 13           |

¹ The first case of the run, so it includes the module warm-up the later ones do not pay.

## Also

`StudySessionHeader` gained `pb-3` in the chrome work: transparent over the scene, its last row
could run to the header's edge; as an opaque block it needs padding inside the block. Recorded here
because the chrome spec did not list it.
