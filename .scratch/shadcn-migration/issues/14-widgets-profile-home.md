# Cluster: Profile / Home widgets rework

Type: grilling
Status: resolved
Blocked by: 04, 08, 09

## Question

Per-widget rework plan (compose migrated primitives + kept domain glyphs from 09):

- `profile-header`, `home-header` — `Card`/`Avatar`/`Button` + domain glyphs.
- `badge-list`, `achievement-list` — lists over `BadgeMedallion`/`TierPips` (kept, 09) + `Card`.
- `streak-calendar`, `streak-summary` — domain visualizations; `Card` container, no shadcn part.
- `notifications-panel` — `Card`/list + `Sheet`/`Drawer` (07) if it's an overlay.

For each: primitives composed, domain markup retained, token/motion compliance, test impact.

## Answer

Compose migrated primitives + kept domain glyphs (09) / app-shell (08). No new domain components.

- `profile-header` (`ProfileBar`/`ProfileHero`) → migrated `Avatar`/`ProgressBar`/`IconButton`;
  `StickyBar` **kept** (app-shell, 08); `use-sticky-header` kept (11).
- `home-header` (`HomeHeader`) → same primitive set + kept `StickyBar`.
- `badge-list` (`BadgeGrid`/`BadgesSection`/`NextMilestoneCard`) → glyphs `BadgeMedallion`/`TierPips`/
  `CollectionPreview` **kept** (09); migrate `ProgressBar`.
- `achievement-list` (`AchievementGrid`/`AchievementsSection`) → `BadgeMedallion`/`CollectionPreview`
  **kept** (09).
- `streak-calendar` (`StreakCalendar`) → `GlassCard` **kept** (08) + migrated `IconButton`.
- `streak-summary` (`StreakSummary`) → migrated `Card` + `ProgressBar`.
- `notifications-panel` (`NotificationsPanel`) → migrated `Chip`/`IconButton`; **`SwipeRow` kept
  (domain)**, its gesture layer rebuilt on `@use-gesture` (10) — no call-site API change here.

⚠ New: **`cardSurface`** (a `shared/ui` class-helper used by `NextMilestoneCard`/`NotificationsPanel`,
not in 03's component list) → reconcile with migrated `Card` (fold in, or keep as a token helper) —
handoff (16) note. Tests updated.
