# Cluster: Study widgets rework

Type: grilling
Status: resolved
Blocked by: 04, 05, 06, 07, 08, 09

## Question

Widgets are **first-class rework targets** (rebuilt on migrated primitives, not re-pointed
imports). Per-widget plan for the Study cluster:

- `study-session` (incl. `StudyDeck` — a `@use-gesture` `useDrag` site; per 10 **`@use-gesture`
  stays** (out-of-scope-additive; its 2-axis throw + `filterTaps` has no Base UI equivalent)),
  `quiz`, `match`, `practice-modes`, `threshold`, `session-reward`.

For each: which migrated primitives it composes (`Button`, `Card`, `Dialog`/`Drawer`, `Progress`,
`ToggleGroup`, `SegmentedControl`, `Badge`…), what domain markup stays, motion reconciliation
(conventions §8, `prefers-reduced-motion`), safe-area/`MOBILE_DESIGN` compliance, and test impact.
Do not disturb gesture surfaces (10) or drop-flicker fixes (§10).

## Answer

Rebuild on migrated primitives (02). **Cross-cutting:** the Study cluster owns **4 of the 5 `Sheet`
call sites** → all rebuild on the Base UI **`Drawer`** (07).

- `study-session`:
  - `StudyDeck` → **rebuild markup on migrated primitives; keep its `@use-gesture` `useDrag`**
    (out-of-scope-additive, 10 — the 2-axis throw + `filterTaps` has no Base UI equivalent).
  - `FlashcardsPanel` → migrated `Button` + `GradeButtons`; keep `speak`/`useShake`/`tick` (11).
  - `QuickActionsSheet` / `ModeSheet` / `GearSheet` / `InStudyEditor` → **rebuild on Base UI
    `Drawer`** (07); inner controls on migrated `Button` / `TextField`(Field, 05) / `Switch`(06) /
    `Combobox`(kept, 06). `SheetSection` / `ToggleRow` / `QuickActionRows` = domain rows, **keep**.
  - `CompletionOverlay` → migrated `Button`; keep motion overlay.
  - `faces/*` (Card/Prompt/Answer/Blur/Initials/Rebuild/Type) → **keep (domain)** — study-card
    faces on `motion`, no shadcn part.
- `quiz`: `QuizSession` → migrated `Button`/`Card`/`Chip`/`IconButton`; `QuizOptionsSheet` → Base UI
  `Drawer` + migrated `Switch`.
- `match`: `MatchBoard` → migrated `Button`/`Chip`/`IconButton`; keep board motion.
- `practice-modes` → **keep (domain)**; rebuild inner controls on migrated primitives.
- `threshold` (`Threshold`/`AuthLogo`) → **keep (domain)** auth screen; fields via migrated
  `Field`/`Input` (05).
- `session-reward` (`use-session-reward`) → **keep, untouched** — event-bus logic, no UI.

Tests: study-session/quiz component tests updated to compound APIs + `Drawer`.
