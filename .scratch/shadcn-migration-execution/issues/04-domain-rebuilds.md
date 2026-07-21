# 04 — Domain component rebuilds (non-overlay)

Type: task
Blocked by: 02, 03
Status: open

## Question

Rebuild these domain components on the new primitives (handoff §3 "Rebuild on a primitive"):

- `SegmentedControl` → `ToggleGroup` (single) + keep the motion pill (06).
- `SortControl` → `DropdownMenu` (06).
- `IconColorRow` → `ToggleGroup` (06).
- `PasswordField` → `Input` + reveal (05); `AuthField` → `Field` (05).
- `ConfirmDialog` → `AlertDialog` thin wrapper (07) — **hand-port**, already Base UI.
- `OverflowMenuButton` → `DropdownMenu` trigger (04).
- `FlyoutMenu` → `DropdownMenu` (07) — **hand-port**, already Base UI (shared trigger with OverflowMenu).

Keep-domain-with-migrated-primitives: `EmojiField`/`EditableTitle` (05), `Combobox` (Base UI, keep, 06),
`SelectDot`/`SelectToolbar`/`select-actions` (06). Update their `*.test.tsx` to the compound API.
Verify gate green.
