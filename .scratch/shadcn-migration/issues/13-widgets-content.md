# Cluster: Content-authoring widgets rework

Type: grilling
Status: resolved
Blocked by: 04, 05, 06, 07, 08, 09

## Question

Per-widget rework plan for the content cluster:

- `content-editor` (incl. `CardBrowser` — a `@use-gesture` `useDrag` site; per 10 **`@use-gesture`
  stays** (out-of-scope-additive; axis-locked pager + `filterTaps` has no Base UI equivalent)),
- `deck-tree` — drag/drop surface; **`DropIndicator` (09) + `use-optimistic-patch` (11) untouched**,
  honor `CODE_STYLE.md` §10 drop-flicker rules,
- `folder-form` — rebuild on the migrated `Field`/`Input` pattern (05) + `Dialog`/`Drawer` (07).

For each: migrated primitives composed, domain markup retained, and test impact. **The four §10
drop-flicker causes must not regress.**

## Answer

- `content-editor`:
  - `CardBrowser` → **rebuild markup on migrated primitives; keep its `@use-gesture` `useDrag`**
    (out-of-scope-additive, 10). `FlyoutMenu` → migrated `DropdownMenu` (07).
  - `DeckContentEditor` (the big editor) → rebuild on migrated `Button`/`Card`/`Field`; keep the
    domain orchestration + import/error flows.
  - `editor-fields` → migrated `TextField`/`Textarea` on the `Field` pattern (05).
  - `ContentRows` → keep `useLongPress` (11); rebuild rows on migrated primitives (`SwipeRow` kept).
  - `ReorderableList` → **keep `@dnd-kit`** (`useSortableSensors`, out-of-scope-additive, 11); §10.
  - `SelectModeBar` → **keep (domain)** — bulk-select (06).
- `deck-tree` (`DeckTree`) → rebuild on migrated primitives; **keep `@dnd-kit` + `DropIndicator`
  (09) + `use-optimistic-patch` (11); do NOT regress §10 drop-flicker**; `useLongPress` kept.
- `folder-form` (`FolderForm`) → migrated `TextField`(Field, 05) + `IconColorRow`(rebuilt on
  `ToggleGroup`, 06); keep `useAutoSelect` (11).

Tests updated; the four §10 drop-flicker causes explicitly re-verified on `deck-tree`/`ReorderableList`.
