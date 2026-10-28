# ADR 0003 — The Library: the archive is a place, one arrangement, only what applies

- **Status:** accepted · **Date:** 2026-09 · consolidated 2026-10

The implementation is `entities/deck/model/placement.ts`, the `features/deck` commands (`archiveDecks`,
`restoreDecks`, `moveDecks`, `detachArchivedDecks`), `shared/lib/library-arrangement.ts`, `shared/lib/deck-order.ts`
and `reachableDecks` in `shared/lib/deck-tree.ts`. Deck settings, including which ones a subdeck may hold, are
[ADR 0008](0008-deck-settings.md).

## Context

- `archived` was a flag on a deck left where it stood. Everything that walked the tree had to remember to skip it,
  and several things didn't: deleting a parent deleted its archived subdecks, a parent's count and study took an
  archived subdeck's cards while the due badge skipped them, and a deck restored into a folder deleted meanwhile
  vanished.
- The Library's order lived in the Library page. The move sheet and the deck switcher listed decks by `order` alone,
  so they ignored the learner's sort, filter and group headings.
- Replication can leave a deck naming a folder or parent another device deleted. The tree is read from the top down,
  so such a deck was on no list while its cards still counted as held.
- The app offered every sort, filter and action whether or not it could do anything here: twelve Bible book filters
  on a device with no Bible decks, Reset on a card never scheduled.

## Decision

- **The archive is a location, not a flag.** Archiving lifts the deck to `parentId: null, folderId: null` with
  `archived: true`; its subdecks stay under it and are archived with it. Restoring lands the deck, subdecks and all,
  last at the top of the Library. The one exception is the Undo on the archive toast, which puts the deck back while
  its old place still exists (`restoreDecks`' `from`). The archive is in no folder, so deleting a folder deletes
  every deck in it. A separate archive collection was rejected: a second RxDB collection, Supabase table and
  replication stream, cards following their deck between them, and every reader unioning two sets, for nothing a
  learner can see.
- **A batch is placed from one snapshot.** `placeDecks` computes every order and carried setting at once, so decks
  landing in one row take consecutive orders. A batch built from a selection drops every deck a selected ancestor
  already carries (`idsWithoutDescendants`).
- **One arrangement.** `arrangeLibrary` decides which order each level follows, what the filter keeps and which group
  headings a shelf shows. `useLibraryArrangement` (`widgets/deck-tree`) is the only way in; the Library, the
  `DestinationSheet` (move, More decks…, the Bible import's target, the card editor, deck settings) and the
  `DeckSwitcher` all read it.
- **Orders and the filter are set in select mode and stay set.** Orders are Manual, Name, Recent, Due, plus any an
  extension contributes (`deckSorts`). The top level follows `deckSort`; a deck's subdecks follow
  `subdeckSorts[deck] ?? (deckSortSubdecks ? deckSort : 'manual')`. Folders follow Name and Recent and keep their
  dragged order otherwise. Name orders compare naturally (`compareNatural`). The filter is `preferences.deckFilter`,
  open to extension ids (`deckFilters`); it narrows the top of a list only, never a deck's contents, and a browsing
  list that it narrows says so (`FilteredNotice`) with a way back to the control.
- **A drag is offered only where a level is in manual order.** Under any other order the rows hold still. A drag on
  a filtered level writes back over the whole level (`mergeVisibleOrder`).
- **A deck whose place is gone stands at the top** (`reachableDecks`): its folder or parent is gone or archived, or
  its parents loop. Read-side only, because a pull can land a deck before its folder and a repair that wrote would
  unfile it for good. Sync asks about the case too ([ADR 0005](0005-sync.md)).
- **Offer only what applies.** An option is offered when it can change what the learner sees, and always when it is
  the one applied. Omit it when this screen or row can't use it (no subdecks, never reviewed, no deck in the canon).
  Disable it when the learner is one tap from making it apply (nothing selected yet), so the select toolbar reads the
  screen, never the selection. Extension contributions need nothing new: a filter applies when `decks.some(keep)`, an
  order when some deck ranks. Actions use `offer(when, handler)` (`shared/ui/action-handlers.ts`); a missing handler
  drops the action from the menu, the rails and the toolbar. Toggles (flag, freeze, reverse) and grade stay offered.

## Consequences

- **Archives stored in place are repaired whenever they appear.** `keepArchiveDetached`, started by the composition
  root, runs `detachArchivedDecks` when an archived deck still names a folder, or a parent that was not archived with
  it, including one pulled later from an older build. It is a keeper, not a migration: the shape didn't change, and
  one document can't tell whether its parent is archived. It writes nothing once the archive is whole.
- `keepSubdeckOrdersOwned` forgets a `subdeckSorts` entry whose deck is deleted and keeps an archived one's.
- The All-subdecks switch writes a Library-wide preference, so it is offered when any live subdeck exists anywhere,
  and withheld inside one deck's own subdeck order, where it would only throw that order away.
- A stored order or filter whose extension is off reads as Manual or All, and comes back when the extension does.

## History

- Archive as a hidden flag on a deck left in place. Replaced by the archive as a place (2026-09).
- One Library order, written only by a drag. Then one order with "a drag resets to Manual", and a filter that reset
  when select mode closed (2026-09). Replaced by orders per level, drag only under Manual, a filter that persists.
- The Library's arrangement inside the Library page, the move sheet and switcher ordering by `order` alone. Replaced
  by one arrangement (2026-09).
- Every action offered on every card, so a configured rail never came up empty. Replaced by offer only what applies
  (2026-09).
