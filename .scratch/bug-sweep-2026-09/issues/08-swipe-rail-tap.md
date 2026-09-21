# 08 — Swipe rail action does nothing (deck detail)
Status: resolved
Type: task

Reading `SwipeRow.fireFromTray → close → onAction` is correct; no test covers a tray tap. Need: which rail
(screenshot shows the leading rail: history + study-from), whether the list is in Manual sort, what happens on
tap (nothing / tray closes / wrong action). Then: tray-tap test + audit every `SwipeRow` host.

## Answer
Both trays are `absolute … w-full` and always mounted, so each lies over the whole row; the
trailing one is later in the DOM, so it paints on top. `opacity: 0` does not remove it from
hit-testing, so every tap meant for an open **leading** button landed on the trailing tray's empty
flex area and did nothing. Trailing worked because it was the one on top.

Fix: each rail's `pointerEvents` follows the same motion value as its opacity — `auto` only on the
side the row is open on. Audit: the other transparent overlays (`HeaderLift`, `DirectionChip`) are
already `pointer-events-none`, `HeaderChrome` uses `inert`, and the dnd `opacity-0` source rows are
dnd-kit's own. SwipeRow was the only offender. Rule in CODE_STYLE §5 (a control's footprint /
invisible is not absent). Tests: `SwipeRow.test.tsx` ×4.
