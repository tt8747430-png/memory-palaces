# 09 — Widgets: Profile & Home (cluster 14)

Type: task
Blocked by: 04, 06
Status: resolved

## Question

Rebuild Profile/Home surfaces on migrated primitives (handoff §3 Widgets / cluster 14):

- Compose migrated `Avatar`/`Progress`/`Card`/`Chip`/`IconButton` + kept glyphs (09) /
  `GlassCard` / `StickyBar` / `SwipeRow` (gesture layer now on `@use-gesture`, ticket 06).
- Reconcile the `cardSurface` helper with the migrated `Card` (handoff cluster 14).

Keep-domain glyphs (`DeckCover`/`FolderGlyph`/`BadgeMedallion`/`TierPips`/`SrsStatusChip`/
`CollectionPreview`/`CardMaturityOverview`/`StudyOverviewCard`/`WordReveal`/`DropIndicator`) consume
migrated primitives only. Verify gate green.

## Answer

Landed (no code change — satisfied transitively). Gate: profile/home widgets **7 files / 32 tests**,
full suite **540/540**.

- The Profile/Home surfaces (profile-header/ProfileHero, home-header/HomeHeader, streak-summary,
  streak-calendar, badge-list, notifications-panel) compose only migrated primitives via the barrel —
  Avatar/Progress/Card/Chip/IconButton — and their `ProgressBar`→`Progress` consumers were already
  renamed in ticket 03. SwipeRow's gesture layer is on `@use-gesture` (06). Kept glyphs
  (GlassCard/StickyBar/DeckCover/FolderGlyph/BadgeMedallion/TierPips/SrsStatusChip/CollectionPreview/
  CardMaturityOverview/StudyOverviewCard/WordReveal/DropIndicator) unchanged.
- **`cardSurface` reconciled:** it already moved to `primitives/card.ts` in ticket 03 (identical
  string `rounded-card bg-card shadow-rest`); StatTile's deep import was repointed there and all other
  consumers use the barrel re-export. A scan for un-migrated primitives (TextField/ProgressBar/
  EmptyState/old button-IconButton-Switch/raw dialog-menu/vaul/role=switch) across these widgets +
  glyphs found **none**. **Unblocks 11.**
