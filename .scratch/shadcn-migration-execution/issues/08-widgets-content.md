# 08 — Widgets: Content editor (cluster 13)

Type: task
Blocked by: 04, 05
Status: open

## Question

Rebuild the `content-editor` widget on migrated primitives (handoff §3 Widgets / cluster 13):

- `CardBrowser` **keeps `@use-gesture`**; its `FlyoutMenu` → `DropdownMenu` (04); its `Sheet` site →
  Drawer (the 5th sheet site).
- `deck-tree` keeps `@dnd-kit` + `DropIndicator` + `use-optimistic-patch` — **§10 drop-flicker
  rules intact**, verify no regression (handoff §4 risk).
- `folder-form` on `Field` / `IconColorRow`; `SelectModeBar` keep.

Verify gate green.
