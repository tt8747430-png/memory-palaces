# ADR 0001 — Drag reorders, never re-parents; one drag engine; real cards in every stack

- **Status:** accepted · **Date:** 2026-07-26
- **Supersedes:** the flattened-tree drag-nest design (horizontal offset chose a nesting depth)

## Context

Four `DndContext` implementations had drifted apart in feel. The library's drag did two things at once — vertical to
reorder, horizontal to re-parent — so a drop's meaning depended on a gesture the user couldn't see themselves making.
Three surfaces drew a "stack of cards" as a blank rectangle; a stack not made of the real items can't animate into or
out of them, so every transition had to be a cross-fade or an off-screen slide.

## Decision

### 1. A drag only ever reorders

Re-parenting is an explicit act with its own surface (`MoveDeckSheet`). A drop is a guess about where a finger was; a
re-parent is too consequential to infer from one.

**One exception:** a deck released over a **folder row** files into it — the target is discrete and self-announcing (the
row lights up, its glyph swells) so drifting can't trigger it.

### 2. Every reachable row must be a peer of the row in hand

"Rows make room" is a _promise_ that the drop is a reorder. In a tree half the rows under the finger aren't peers, so
the promise is a lie before the user releases.

Rather than weaken the animation, the library changes what it shows. **Select mode is flat:** `Folders` then `Decks`, no
expand control, subdecks never on screen. Selecting a deck takes its subtree; long-pressing a subdeck selects its
top-level ancestor. `DeckTree` doesn't drag at all.

> **Consequence:** don't add a drag to a surface rendering a hierarchy. Flatten it first.

### 3. One engine, and the library is the reference

`useSortableBlock()` is headless and owns all _behaviour_ — which rows a drag carries, the pile, where a drop lands, how
rows get there, plus the two `DndContext` settings that must not vary (`collision`, `dropAnimation`). `SortableRow` owns
row anatomy. Surfaces differ in what they render, never in how a drag behaves.

| Surface                             | Renders                             | Engine             |
|-------------------------------------|-------------------------------------|--------------------|
| `deck-tree/ui/LibrarySelectList`    | two sections + folder drop target   | `useSortableBlock` |
| `content-editor/ui/ReorderableList` | flat list, order held from props    | `useSortableBlock` |
| `settings-select`, `settings-swipe` | horizontal chips across two buckets | own `DndContext`   |

Settings pages stay out deliberately: single-item assignment across two buckets, horizontal, no multi-select. Sharing
`useSortableSensors` is the whole overlap.

> **`LibrarySelectList` is the reference. Unifying means moving other surfaces towards it, never it towards them.** Its
> feel is the one tuned against real use; every other list is a copy that drifted. (Learned 2026-07-26: "unify these" was
> read as meet-in-the-middle, the library got a drop animation it had deliberately gone without, and a working surface
> regressed.)

Four drifts, all resolved in the library's favour:

|                | had been             | now                               |
|----------------|----------------------|-----------------------------------|
| collision      | `closestCenter`      | `pointerWithin` → `closestCenter` |
| drop           | 220ms fly-to-slot    | `null`                            |
| row anatomy    | inline `useSortable` | `SortableRow`                     |
| mount entrance | `opacity 0→1, y 8`   | none while reorderable            |

**Why `dropAnimation` is `null`:** the dropped state is already true on screen when the finger lifts (order held
optimistically), so an overlay still travelling toward a row already in place is a duplicate, not a transition. A stack
isn't shaped like any single row — nothing to fly _as_.

**Why the entrance had to go:** a carried row remounts on landing, so a mount entrance animates `opacity` on the landing
row (the fourth flicker cause) and fights `useStackLanding`.

**Why `SortableRow` hands the frame back to the child:** a row's surface, ring and padding live on its own element, and
that's what `opacity-0` and the landing must apply to. A wrapper silently changes what's hidden and what's animated.

### 4. A stack is made of the real items

`StackedDragPreview` takes the real rows as `layers`, clipped to the front row's frame. `StudyDeck`/`CardBrowser` render
the real next cards behind the current one, inert, posed by depth. That's what buys the animation: a promoted card
already _is_ the thing it becomes, so advancing is a change of pose — not a cross-fade with a placeholder.

## How it behaves

**Carrying a selection.** Grab any selected row, the whole selection travels; lands contiguously (`moveBlock()`), after
the target from above and before it from below. Carried rows other than the tracked one leave the flow, so exactly one
gap opens, at the block's edge.

**The pile.** Top row = most recently selected, not the one the drag started from — the stack reads as what you just
gathered. `selectedIds` is a `Set`, so the answer is its tail.

**Putting it down.** The overlay is dismissed outright for every drag. A single row is already home (sortable has shown
it in its landing slot all drag). A block travels — `useStackLanding()` FLIPs each row from the drag's translated rect
through the Web Animations API, off the React render path, staggered. Without it they blink into place and the stack
reads as a lie.

**Card decks.** `DEPTH_POSE` constants: depth 0 in play, then stepped back and down. Advancing keys the front slot by
card id — the outgoing card was already flung away, the arriving one enters from the pose it held a layer down.
`CardBrowser` going _backwards_ has no deck to draw from, so the card returns from the edge.

> **Queued list is nearest-first: `depth={i + 1}`.** Inverted (`length - i`) draws the furthest queued card in the
> visible slot — peek at 15, swipe, 14 arrives. Invisible while the deck is still, which is why both stacks carry a
`z-index` test asserting the nearest layer holds the card the next swipe promotes. Shipped inverted once; don't
> re-derive by eye.

**Reduced motion.** `useStackLanding` does nothing — rows are already in place, only the travel drops. Card stacks skip
entrance poses.

## Consequences

- `projectDrop()` and pointer-X depth tracking are gone. Don't reintroduce a gesture whose meaning isn't visible.
- Mixed selections can still be acted on together, but a drag reorders only within its own kind.
- Drag _feel_ can't be verified in jsdom — every change needs a real-device pass.
- The four flicker causes remain the operational checklist: [`CODE_STYLE.md` §10](../CODE_STYLE.md).
