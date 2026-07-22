# 04 — Domain component rebuilds (non-overlay)

Type: task
Blocked by: 02, 03
Status: resolved

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

## Answer

Landed. Six components rebuilt on the ticket-03 foundations (all via same-slice deep imports —
`./primitives/toggle-group|dropdown-menu|alert-dialog|field`). Gate: typecheck clean, lint 0 errors,
**538/538**.

- **SegmentedControl** → `ToggleGroup` (single-select `value={[value]}`; ignores Base UI's empty-array
  deselect to keep exactly one active) + the `layoutId` motion pill preserved inside the active item.
  Now gets roving focus + arrow-key nav for free.
- **IconColorRow** → `ToggleGroup` colour swatches; `whileTap` scale replaced by CSS
  `active:scale-90 motion-reduce:active:scale-100`, ring driven by `data-[pressed]`. EmojiField kept.
- **SortControl** → `DropdownMenu` **RadioGroup/RadioItem** (proper single-select semantics + check
  indicator) instead of the old action-list; custom trigger button kept (chevron still flips via
  `group-data-popup-open`).
- **FlyoutMenu** → `DropdownMenu` (Trigger/Content/Item), same `SheetAction[]` API + the
  stop-propagation default trigger. **OverflowMenuButton** unchanged (still wraps FlyoutMenu).
- **ConfirmDialog** → `AlertDialog` thin wrapper. Behaviour change (intended): now `role="alertdialog"`,
  always-modal, **no outside-press dismiss** — the right semantics for log-out / delete-account. Two
  consumer tests updated `findByRole('dialog')`→`'alertdialog'` (SettingsPage, SettingsProfilePage).
- **AuthField** → Base UI `Field` (+ `Input`): label↔control association, `aria-invalid` and error
  `aria-describedby` now wired by the primitive (`Field.Root invalid` + `Field.Error match`); glass look
  and icon/right-slot/valid-check overlays preserved. **PasswordField** unchanged (composes AuthField).

**Foundation-shape tweaks made here:** `ToggleGroup`/`ToggleGroupItem` bases stripped to near-nothing
(bespoke consumers own layout); `DropdownMenuRadioItem` now takes free children with an `ml-auto`
indicator (leading icon + label + trailing check).

Component tests (SegmentedControl/FlyoutMenu/AuthField) passed **unmodified** — public APIs were kept
stable, so the anticipated "compound API" test rewrite wasn't needed. Keep-as-is components
(EmojiField/EditableTitle/Combobox/SelectDot/SelectToolbar/select-actions) untouched; their tests stay
green. **Unblocks 07 (+09). 05/06 independent.**
