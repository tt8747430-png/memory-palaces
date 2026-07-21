# 09 — Widgets: Profile & Home (cluster 14)

Type: task
Blocked by: 04, 06
Status: open

## Question

Rebuild Profile/Home surfaces on migrated primitives (handoff §3 Widgets / cluster 14):

- Compose migrated `Avatar`/`Progress`/`Card`/`Chip`/`IconButton` + kept glyphs (09) /
  `GlassCard` / `StickyBar` / `SwipeRow` (gesture layer now on `@use-gesture`, ticket 06).
- Reconcile the `cardSurface` helper with the migrated `Card` (handoff cluster 14).

Keep-domain glyphs (`DeckCover`/`FolderGlyph`/`BadgeMedallion`/`TierPips`/`SrsStatusChip`/
`CollectionPreview`/`CardMaturityOverview`/`StudyOverviewCard`/`WordReveal`/`DropIndicator`) consume
migrated primitives only. Verify gate green.
