# 08 — Widgets: Content editor (cluster 13)

Type: task
Blocked by: 04, 05
Status: resolved

## Question

Rebuild the `content-editor` widget on migrated primitives (handoff §3 Widgets / cluster 13):

- `CardBrowser` **keeps `@use-gesture`**; its `FlyoutMenu` → `DropdownMenu` (04); its `Sheet` site →
  Drawer (the 5th sheet site).
- `deck-tree` keeps `@dnd-kit` + `DropIndicator` + `use-optimistic-patch` — **§10 drop-flicker
  rules intact**, verify no regression (handoff §4 risk).
- `folder-form` on `Field` / `IconColorRow`; `SelectModeBar` keep.

Verify gate green.

## Answer

Landed (no code change — satisfied transitively by 04/05/06). Gate: content-editor + deck-tree +
folder-form **6/6**, full suite **540/540**.

- **CardBrowser** — kept on Base UI `Dialog` + `@use-gesture`, `FlyoutMenu` already → DropdownMenu (04).
  ⚠ **Ticket-body correction:** the "its `Sheet` site → Drawer (5th sheet site)" line was an over-reach.
  The authoritative handoff §3 Content(13) row says only *"CardBrowser keeps @use-gesture,
  FlyoutMenu→DropdownMenu"* — no Dialog→Drawer. CardBrowser is a **full-screen** card gallery, not a
  bottom sheet; a vertical-swipe Drawer would regress the UX and fight the card's horizontal
  `@use-gesture` swipe. The genuine 5th shared-`Sheet` call site is **DeckContentEditor** (2 sheets),
  already on Drawer via 05.
- **folder-form** — already on `IconColorRow` (04) + `Input` (bare, aria-labelled — the sheet title is
  its label, so no `FieldLabel` needed). No change.
- **ContentRows** → SwipeRow (06); **editor-fields** → Input/Textarea (migrated) + a small local label
  helper (left as-is — not a Base UI `Field` candidate); **SelectModeBar**/ReorderableList kept.
- **deck-tree** — untouched: `@dnd-kit` + `DropIndicator` + `siblingDecks`/`useOptimisticPatch` §10
  pieces intact, tests green (no drop-flicker regression). **Unblocks 11.**
