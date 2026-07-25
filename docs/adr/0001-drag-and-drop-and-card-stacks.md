# ADR 0001 — Drag reorders, never re-parents; one drag engine; real cards in every stack

- **Status:** accepted
- **Date:** 2026-07-26
- **Supersedes:** the flattened-tree drag-nest design (horizontal drag offset chose a nesting depth)

## Context

Reordering had grown four separate `DndContext` implementations that had drifted apart in feel:
the deck library, the card/question list, and the two settings pages. The library's drag also did
two different things at once — vertical to reorder, horizontal to change a deck's parent — which
meant a drop's meaning depended on a gesture the user could not see themselves making.

Three surfaces also drew "a stack of cards" as a stub: a blank rounded rectangle behind the real
one. A stack that isn't made of the real items can't animate into or out of them, so every
transition had to be a cross-fade or a slide from off screen.

## Decision

### 1. A drag only ever reorders

Changing what a deck belongs to is an explicit act with its own surface (`MoveDeckSheet`). A drop
is a guess about where a finger was; a re-parent is too consequential to infer from one.

**One exception:** a deck released over a **folder row** is filed into that folder. This is safe
because the target is discrete and self-announcing — the folder row lights up and its glyph swells
before the finger lifts — so it cannot be triggered by drifting.

### 2. Every row a drag can reach must be a peer of the row in hand

`verticalListSortingStrategy`'s "rows make room" animation is a _promise_ that the drop is a
reorder. In a tree, half the rows under the finger aren't peers, so the promise is a lie before the
user even releases.

Rather than weaken the animation, the library changes what it shows. **Select mode is flat:** two
sections, `Folders` then `Decks`, with no expand control, so subdecks are never on screen.
Selecting a deck takes its whole subtree with it; long-pressing a subdeck selects its top-level
ancestor, because the subdeck itself is not a row select mode renders. The nested browse tree
(`DeckTree`) does not drag at all.

> **Consequence:** don't add a drag to a surface that renders a hierarchy. Flatten it first.

### 3. One drag engine

`useSortableBlock()` (`shared/lib/use-sortable-block.ts`) is headless and owns everything about
_behaviour_: which rows a drag carries, what the pile looks like, where a drop lands, how the rows
get there. Surfaces differ in what they render, never in how a drag behaves.

| Surface                                         | Renders                              | Engine             |
| ----------------------------------------------- | ------------------------------------ | ------------------ |
| `widgets/deck-tree/ui/LibrarySelectList`        | two sections + folder drop target    | `useSortableBlock` |
| `widgets/content-editor/ui/ReorderableList`     | one flat list, order held from props | `useSortableBlock` |
| `pages/settings-select`, `pages/settings-swipe` | horizontal chips across two buckets  | own `DndContext`   |

The settings pages are deliberately **not** folded in. They are not a reorder-among-peers: they are
single-item assignment across two buckets with add/remove, horizontal, no multi-select. Sharing the
sensors (`useSortableSensors`) is the whole overlap; forcing the rest would be abstraction for its
own sake.

### 4. A stack is made of the real items

`StackedDragPreview` takes the **real rows** as `layers`, clipped to the front row's frame so rows
of different heights still pile up tidily. The same rule applies to card decks: `StudyDeck` and
`CardBrowser` render the real next cards behind the current one, inert, posed by depth.

This is what buys the animation. A card promoted out of the deck is already exactly the thing it
becomes, so advancing is a change of pose — not a cross-fade between a placeholder and a real face,
and not a slide in from off screen.

## How it behaves

**Carrying a selection.** Grab any selected row and the whole selection travels. It lands
contiguously (`moveBlock()`), after the target when it came from above and before it when it came
from below — dnd-kit's own single-row rule, generalised. Carried rows other than the one dnd-kit is
tracking leave the flow while the drag is live, so exactly one gap opens, at the block's edge.

**The pile.** The row on top is the one selected **most recently**, not the one the drag started
from — the stack reads as what you just gathered. `selectedIds` is a `Set` and a `Set` keeps
insertion order, so the answer is its tail; deselecting and reselecting moves a row to the end,
which is what "most recently" should mean.

**Putting it down.** A multi-row drag gets `dropAnimation={null}`: the count is a fact about a drag
that is over, so the stack and its badge clear the instant the finger lifts. The rows then _travel_
from the pile to their slots — `useStackLanding()` FLIPs each one from the drag's translated rect
through the Web Animations API, off the React render path, staggered top-to-bottom. Without it the
rows simply blink into place several rows apart and the stack reads as a lie. A single-row drag
keeps dnd-kit's own drop animation instead, because the row in hand _is_ the row that lands.

**Card decks.** Depth poses are constants (`DEPTH_POSE`): depth 0 in play, then stepped back and
down. Advancing keys the front slot by card id — the outgoing card has already been flung away and
simply unmounts, while the arriving card enters from the pose it held one layer down. `CardBrowser`
going _backwards_ has no deck to draw from (the stack only holds what is ahead), so there the card
returns the way it left, from the edge.

> **The queued list is nearest-first, so `depth` counts _up_ with the index — `depth={i + 1}`.**
> This is the one thing in a stack that is easy to get backwards and impossible to notice while
> the deck is still. Inverting it (`length - i`) draws the _furthest_ queued card in the visible
> slot: you peek at card 15, swipe, and card 14 arrives. The stack looks perfectly fine until it
> moves, which is why both `StudyDeck` and `CardBrowser` carry a test that reads the `z-index` of
> the queued layers and asserts the nearest one holds the card the next swipe promotes. Shipped
> inverted once (2026-07-26); don't re-derive it by eye.

**Reduced motion.** `useStackLanding` does nothing at all — the rows are already in the right
places, only the travel is dropped. Card stacks skip their entrance poses.

## Consequences

- `projectDrop()` and the pointer-X depth tracking are gone. Don't reintroduce a gesture whose
  meaning isn't visible.
- Mixed selections (a folder and a deck) can still be acted on together, but a drag only reorders
  within its own kind.
- Drag _feel_ cannot be verified in jsdom. Every change here needs a real-device pass.
- The four drop-flicker causes still apply and are the operational checklist:
  [`docs/CODE_STYLE.md` §10](../CODE_STYLE.md).
