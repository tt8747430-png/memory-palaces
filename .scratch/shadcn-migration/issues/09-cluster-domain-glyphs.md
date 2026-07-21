# Cluster: Domain glyphs & visualizations (no shadcn equivalent — keep unless justified)

Type: grilling
Status: resolved
Blocked by: 02

## Question

These have **no shadcn equivalent** — they encode Mindscape domain concepts. Default frame:
**keep as domain components**, but decide per-member whether any internal primitive (badge,
progress, card) should be rebuilt on shadcn, and confirm token/animation compliance. Explicit
verdict for each:

- `DeckCover`, `FolderGlyph` — deck/folder tiles (memory: prefers generously rounded,
  `rounded-2xl`). Keep; verify token usage.
- `BadgeMedallion` (89 lines), `TierPips`, `SrsStatusChip` (`SrsStatusChip.test`) — status
  glyphs. Keep; `SrsStatusChip` may compose shadcn `Badge`.
- `CollectionPreview`, `CardMaturityOverview` (`CardMaturityOverview` in barrel),
  `StudyOverviewCard` (`StudyOverviewCard.test`) — composite overviews; rebuild container on
  shadcn `Card`?
- `WordReveal` (`WordReveal.test`) — study animation; keep (motion), no shadcn part.
- `DropIndicator` — drag/drop affordance (`docs/CODE_STYLE.md` §10). Keep; do not disturb
  drop-flicker fixes.

For any "keep": confirm it needs **no** shadcn change beyond consuming migrated primitives,
and record that as the verdict (a "keep" is still a decision).

## Answer

All **keep (domain)** — no shadcn equivalent; each only consumes migrated primitives, nothing more.

- `DeckCover`, `FolderGlyph` → **keep**; verify semantic tokens + generous rounding
  (`rounded-2xl`, per learner preference).
- `BadgeMedallion`, `TierPips` → **keep**; token/motion compliance only.
- `SrsStatusChip` → **keep**; compose the migrated `Badge` internally. Update `SrsStatusChip.test`.
- `CollectionPreview`, `CardMaturityOverview`, `StudyOverviewCard` → **keep**; rebuild the outer
  container on migrated `Card`. Update `StudyOverviewCard.test`.
- `WordReveal` → **keep** — study animation on `motion`, no shadcn part. `WordReveal.test` intact.
- `DropIndicator` → **keep** — drag/drop affordance; **do not disturb** the `CODE_STYLE.md` §10
  drop-flicker fixes.
