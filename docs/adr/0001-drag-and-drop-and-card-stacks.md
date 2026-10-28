# ADR 0001 — A drag only reorders; one drag engine; real cards in every stack

- **Status:** accepted · **Date:** 2026-07 · consolidated 2026-10

The checklist for drop flicker is [CODE_STYLE §10](../CODE_STYLE.md). The engine is `shared/lib/use-sortable-block.ts`.

## Context

A drop is a guess about where a finger was. Early drags in the Library also re-parented: a deck dropped onto another
became its subdeck, with the depth read from the pointer's x (`projectDrop`). Rows that "made room" promised a reorder,
yet half the rows under the finger in a tree were not peers. Each list then grew its own drag, and the copies drifted
apart in collision, drop animation and row anatomy.

## Decision

- **A drag only reorders.** Moving a deck somewhere else is `DestinationSheet`. The one exception: a deck released over
  a **folder row** files into it. That target is discrete and announces itself (the row lights, its glyph swells).
- **Every reachable row is a peer of the row in hand.** Select mode in the Library is flat: Folders, then Decks, no
  expand control, no subdecks on screen. Selecting a deck takes its subtree; long-pressing a subdeck selects its top
  ancestor. `DeckTree` does not drag. Don't add a drag to a surface that draws a hierarchy; flatten it first.
- **One engine.** `useSortableBlock()` owns behaviour: which rows a drag carries, the pile, where a drop lands, and
  the two `DndContext` settings that must not vary (`pointerWithin` then `closestCenter`; `dropAnimation: null`).
  `SortableRow` owns row anatomy and hands the frame back to the child, so `opacity-0` and the landing apply to the
  row's own surface. Users: `LibrarySelectList` and `ReorderableList` (which draws only the rows in view, keeps every
  id in `SortableContext`, and keeps the dragged row drawn wherever it scrolls, ADR 0010).
- **`LibrarySelectList` is the reference.** Unifying means moving other lists towards it, never meeting in the middle.
- **Settings editors are a small second engine.** The select toolbar and swipe editors are one horizontal strip with
  no selection and no pile: `widgets/action-slots`' `useSortableList` (sensors, held order, one drop animation, a drop
  that may be refused when a rail is full). A swipe's two rails are one list with the row standing between them
  (`action-rails.ts`, `ROW`), so changing sides is an ordinary reorder. It shares only `useSortableSensors` and
  `useHeldOrder` with the block engine.
- **A stack is made of the real items.** `StackedDragPreview` takes the real rows as layers. `StudyDeck` and
  `CardBrowser` draw the real next cards behind the current one, inert, posed by depth (`DEPTH_POSE`), so advancing
  is a change of pose, not a cross-fade.

How it behaves:

- A selection travels whole and lands contiguously (`moveBlock()`): after the target from above, before it from
  below. Only one gap opens.
- The top of the pile is the most recently selected row (the tail of the `selectedIds` set).
- The overlay is dismissed outright on drop. A single row is already in its slot. A block lands through
  `useStackLanding()`, a staggered FLIP on the Web Animations API, off the React render path.
- Queued cards are nearest-first: `depth={i + 1}`. Inverted, the furthest card sits in the visible slot. Both stacks
  carry a `z-index` test for this.
- Reduced motion: `useStackLanding` does nothing and card stacks skip entrance poses.

## Consequences

- `dropAnimation` is `null` because the order is held optimistically: the dropped state is already on screen.
- A reorderable row has no mount entrance. A carried row remounts on landing and the entrance would animate it.
- Mixed selections can be acted on together, but a drag reorders only within its own kind.
- Drag feel can't be checked in jsdom. Every change needs a pass on a device.

## History

- Drag re-parents: a deck dropped on a deck becomes its subdeck, depth from pointer x (2026-07). Replaced by
  reorder-only and the move sheet.
- "Unify the lists" read as meet-in-the-middle; the Library gained a drop animation and regressed (2026-07).
- Settings editors as action strips beside an inert preview, then as two strips with a picker sheet (2026-09).
  Replaced by the live bar with a palette.
