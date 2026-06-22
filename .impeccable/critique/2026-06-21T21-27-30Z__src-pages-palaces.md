---
target: palaces page and components
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-06-21T21-27-30Z
slug: src-pages-palaces
---
# Critique — Palaces page (`src/pages/palaces`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Strong skeletons/toasts/active states, but archive, favorite, and move mutate the list silently — no confirmation feedback |
| 2 | Match System / Real World | 3 | "Bible" collection vs "Scripture palace" marker — terminology split for the same concept |
| 3 | User Control and Freedom | 3 | Confirm dialogs + cancel everywhere, archive reversible, but no undo path for delete/archive/move |
| 4 | Consistency and Standards | 4 | Exemplary: one ⋮/long-press pattern, consistent sheets, consistent tokens |
| 5 | Error Prevention | 4 | Destructive actions gated by confirm dialogs; import errors handled |
| 6 | Recognition Rather Than Recall | 3 | Folders store a `color` that's never shown — every folder looks identical (same icon, same accent) |
| 7 | Flexibility and Efficiency | 3 | Grid/list, sort, search, long-press + menu; no bulk actions, no swipe gestures |
| 8 | Aesthetic and Minimalist Design | 3 | Three stacked control rows before content; the result-count row mixes count + "sorted by" + a destructive plain-text "Delete folder" |
| 9 | Error Recovery | 3 | Import errors surfaced via toast; no undo to recover from a mistaken destructive action |
| 10 | Help and Documentation | 3 | Excellent teaching empty states; no other contextual help (acceptable for this surface) |
| **Total** | | **32/40** | **Good — solid foundation, targeted refinement** |

## Anti-Patterns Verdict

Deterministic scan (`detect.mjs`) over the page + CollectionRail + PalaceSheets + PalaceList widget returned **clean (`[]`)**. No side-stripe borders, no gradient text, no decorative glass, no eyebrow scaffolding, no identical-card-grid tell. The surface adheres tightly to its own "Lucid Atrium" design system. This is not AI slop; the work below is genuine refinement of a strong base.

## What's Working

1. **The empty states teach.** "A memory palace is a place you know by heart, filled with what you want to remember" — every empty branch (search / filtered / archived / first-run) has its own copy and the right CTA. This is the product's voice landing exactly.
2. **The presentational/data split is clean.** `PalaceList` reads no stores; the page derives items and wires commands. Grid and list share one ⋮/long-press action vocabulary. Skeletons (not spinners) cover hydration.
3. **Disciplined color system.** Navy + radiant accent gradient used for state (active chip, progress meter) and nothing decorative; coral heart vs navy scripture marker stay semantically distinct.

## Priority Issues

- **[P1] The control zone is cluttered (3 stacked rows).** Rail → grid/list + sort → count + "sorted by" + delete-folder. The result-count line carries a destructive **plain-text "Delete folder"** with low affordance, sitting next to a redundant "Sorted by X" caption. **Fix:** collapse to a calmer two-row meta zone; move folder management out of the count line into a proper folder context (a folder header when a folder is active). Commands: `distill`, `layout`.
- **[P1] Folders are visually indistinguishable.** `Folder.color` is persisted but the rail renders every folder with the same `Folder` icon in the same accent. Users can't scan their own taxonomy. **Fix:** show each folder's color as a leading dot/tint on its chip; let folders be renamed and recolored (currently create + delete only). Commands: `colorize`, feature work.
- **[P2] Silent destructive/stateful actions.** Archive, favorite, and move just mutate the list with no feedback. **Fix:** undo toasts ("Archived — Undo") for archive/move/delete, which also lets archive feel safe without a heavy dialog. Commands: `harden`, `delight`.
- **[P2] Browse shows mastery, not urgency.** The list surfaces progress (% rooms completed) but nothing about what's *due today*. The core product loop is daily spaced review; the palaces screen is the natural place to pull a user back into it. **Fix:** a per-palace "review due" indicator (count badge) so the browse screen drives the daily loop. Commands: feature work.
- **[P3] No swipe gestures despite `SwipeRow` existing.** CLAUDE.md calls for native swipe actions; list rows use only ⋮/long-press. **Fix:** swipe-to-favorite / swipe-to-archive on list rows. Commands: feature work.

## Persona Red Flags

**Casey (distracted mobile):** Archives a palace one-handed and gets zero confirmation — did it work? The item just vanished from the list with no undo. The control zone pushes the first palace further down the scroll on small screens.

**Riley (stress tester):** Creates several folders — all render identically in the rail, only distinguishable by reading each label. The stored folder color is dead data. Can't rename a folder after a typo; only delete + recreate.

**Sam (accessibility):** Mostly strong (aria labels, `role="tablist"`, focus rings). The destructive "Delete folder" is a plain text button mid-row — easy to hit, low affordance, and announced flatly among captions.

## Minor Observations

- "Sorted by {sort}" caption is redundant with the checkmark already shown in the sort sheet.
- Import shares top-bar weight with Create despite being a power action.
- `category !== 'General'` is a magic string in `PalaceList` row meta.

## Questions to Consider

- What would make the palaces screen pull a user *back into practice*, not just browse static progress?
- Should archive ever need a dialog, or is an undo toast the more forgiving, more premium answer?
- If folders carried their color, would the rail itself become the user's mental map?
