# 02 — Header search field: focus ring clipped and overlapping ✕
Status: resolved
Type: task

**Symptom.** IMG_3536: focused field's ring is cut at the bar's left edge and runs into the ✕ button.

**Root cause.** `styles/theme.css` `:focus-visible` = 3px outline + 2px offset = 5px overshoot on every side.
`HeaderSearch` lays the field at `left-2 right-2` (8px) and `SearchField` separates field and ✕ with `gap-1`
(4px). 4px < 5px → overlap; the header bar's own gutter is 8px so the ring lands 3px from the screen edge.

**Fix.** `SearchField` gap ≥ ring overshoot (`gap-2`); `HeaderSearch` keeps the bar's gutter *plus* the ring
(`left-3 right-3` or `inset-x-[calc(theme(spacing.2)+5px)]`). Rule in CODE_STYLE §5.

## Answer
Real cause was the wipe: `HeaderSearch` clip-path ends at `inset(0 0 0 0)`, which cuts the ring on three sides; `gap-1` did the ✕ overlap. Now `FOCUS_RING_OVERSHOOT` (`shared/lib/focus-ring.ts`, held to `theme.css` by test) insets the wipe outward in every pose, and `SearchField` uses `gap-2`. Rule in CODE_STYLE §5 "A control's footprint includes its states". Tests: `HeaderSearch.test.tsx`, `focus-ring.test.ts`.
