# 03 — Primitives batch B (surfaces, menus, overlays foundation)

Type: task
Blocked by: 01
Status: resolved

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

## Answer

Landed. `primitives/` now holds eight more files. Gate: typecheck clean, lint 0 errors,
**538/538 tests**.

**Presentational (public — re-exported through `shared/ui`, replace + delete the old files):**

- `card` — `Card` + `cardSurface` const, `data-slot="card"`. `StatTile` deep-import repointed
  `./Card`→`./primitives/card`.
- `avatar` — kept the lightweight img/initials impl (NOT Base UI `Avatar`): Base UI defers the
  `<img>` until a load event that never fires in jsdom, which breaks the synchronous test for
  negligible gain on our local data/blob URLs. Test moved to `primitives/avatar.test.tsx`.
- `progress` — `ProgressBar`→**`Progress`**, rebuilt on Base UI `Progress.Root` for real
  `progressbar` semantics (`aria-valuenow`/min/max) with the motion fill layered on top; stays
  decorative (`aria-hidden`) when unlabeled, exactly as before. 5 consumers renamed.
- `empty` — `EmptyState`→**`Empty`** (prop API kept — content slots, not boolean props), motion
  entrance + `data-slot`. 2 consumers renamed.

**Compound foundations (internal to `shared/ui`, NOT barrel-exported — see below):**

- `toggle-group` — Base UI `ToggleGroup` + `Toggle` (`ToggleGroupItem`), generic over `Value`.
  Backs SegmentedControl/IconColorRow (04).
- `dropdown-menu` — styled Base UI `Menu` parts (Root/Trigger/Content=Portal+Positioner+Popup/
  Item w/ cva default·active·destructive variants/RadioGroup/RadioItem+indicator/Separator/Label),
  popup+item look lifted from the proven `FlyoutMenu`. Backs SortControl/OverflowMenu/FlyoutMenu (04/07).
- `alert-dialog` — styled Base UI `AlertDialog` (always-modal, no outside-dismiss), chrome matching
  the current `ConfirmDialog`. Backs ConfirmDialog (07).
- `drawer` — Base UI `Drawer`. **§4 risk retired:** `@base-ui/react/drawer` in the installed `^1.6`
  ships native `swipeDirection` + `--drawer-swipe-movement-y`/`--drawer-swipe-progress` +
  `SwipeArea` + `VirtualKeyboardProvider` — so ticket 05 can drop `use-drag-to-dismiss` AND the
  hand-rolled iOS-keyboard offset (VirtualKeyboardProvider handles it). Provided as a bottom-sheet
  foundation (Drawer/Content=Portal+Backdrop+Viewport+Popup+Content/Handle/Header/Footer/Title/
  Description/Close/VirtualKeyboardProvider), no snap/nested-stack (YAGNI for our sheets).

**Decision — foundations kept out of the barrel.** `primitives/index.ts` re-exports only the public
presentational primitives; the four compound foundations are consumed *within* `shared/ui` by the
domain wrappers that tickets 04/05/07 rebuild, via same-slice deep imports (`./primitives/drawer`,
like `StatTile`→`./primitives/card`). This matches the ticket's "(barrel-export public ones)" and
keeps the heavier Base UI drawer/menu modules out of the public barrel's eager-eval graph until a
consumer needs them.

**⚠ Pre-existing flaky test (NOT caused by this ticket).** `widgets/study-session/FlashcardsPanel.test.tsx`
"reveals and grades…" is flaky (~50%: clean `main` fails 3/5 runs, this branch 2/4) — `fireEvent.click`
chained across an `AnimatePresence mode="wait"` reveal/advance gap occasionally races. Full suite is
538/538 when it passes. Flagged to the human; out of scope to fix inside a primitives migration.
