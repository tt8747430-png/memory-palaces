# 07 — Widgets: Study session (cluster 12)

Type: task
Blocked by: 04, 05
Status: open

## Question

Rebuild the `study-session` widget on migrated primitives (handoff §3 Widgets / cluster 12):

- Owns **4/5 `Sheet` sites → Base UI Drawer** (the fifth is CardBrowser's, in ticket 08).
- `StudyDeck` **keeps `@use-gesture`** (card gestures — `filterTaps` + velocity, no Base UI
  equivalent; do **not** hand-roll onto raw pointer events — handoff §4 risk).
- Study faces / overlays keep `motion`; `session-reward` untouched.

Verify gate green.
