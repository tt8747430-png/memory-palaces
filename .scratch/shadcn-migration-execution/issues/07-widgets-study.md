# 07 — Widgets: Study session (cluster 12)

Type: task
Blocked by: 04, 05
Status: resolved

## Question

Rebuild the `study-session` widget on migrated primitives (handoff §3 Widgets / cluster 12):

- Owns **4/5 `Sheet` sites → Base UI Drawer** (the fifth is CardBrowser's, in ticket 08).
- `StudyDeck` **keeps `@use-gesture`** (card gestures — `filterTaps` + velocity, no Base UI
  equivalent; do **not** hand-roll onto raw pointer events — handoff §4 risk).
- Study faces / overlays keep `motion`; `session-reward` untouched.

Verify gate green.

## Answer

Landed. Gate: typecheck clean, lint 0 errors, **540/540**.

Mostly satisfied transitively — the widget consumes only migrated primitives via the barrel
(Button/Input/Combobox/GradeButtons) and the four sheets (ModeSheet, GearSheet, QuickActionsSheet,
InStudyEditor) all use the shared `Sheet`, which ticket 05 already moved to Base UI Drawer. No bespoke
vaul/Dialog overlays existed here, so nothing to hand-port.

One real dedup: **`ToggleRow`** hand-rolled a switch track byte-identical to the migrated `SwitchTrack`
presentational primitive — replaced the inline track+thumb with `<SwitchTrack checked={checked} />`
(zero visual change; row stays the `role="switch"` control).

Kept per spec: **StudyDeck** still on `@use-gesture` (`useDrag`), the study **faces** keep `motion` and
their `onPointerDown` long-press guards, `session-reward` untouched. FlashcardsPanel's pre-existing
flake unaffected. **Unblocks 11.**
