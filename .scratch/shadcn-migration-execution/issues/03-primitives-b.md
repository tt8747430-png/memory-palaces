# 03 — Primitives batch B (surfaces, menus, overlays foundation)

Type: task
Blocked by: 01
Status: claimed

## Question

Add + adapt into `shared/ui/primitives/` (barrel-export public ones), per handoff spec §2.2 / §3:

- `Card` (08), `Avatar` (08), `Progress` (`ProgressBar`→Progress, 08), `Empty` (`EmptyState`→Empty, 08).
- `ToggleGroup` (backs SegmentedControl/IconColorRow, 06).
- `DropdownMenu` (backs SortControl/OverflowMenu/FlyoutMenu, 04/07).
- `AlertDialog` (backs ConfirmDialog, 07).
- **`Drawer` (Base UI, `@base-ui/react/drawer`)** — the foundation for the Sheet→Drawer rework (07).
  ⚠ confirm the Drawer API in the installed `^1.6` before building on it (handoff §4 risk).

Reference: [`base-dialog`](../../shadcn-migration/assets/base-dialog.tsx),
[`base-drawer`](../../shadcn-migration/assets/base-drawer.tsx),
[`base-sheet`](../../shadcn-migration/assets/base-sheet.tsx). Verify gate green.
