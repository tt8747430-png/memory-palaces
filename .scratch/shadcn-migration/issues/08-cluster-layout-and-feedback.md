# Cluster: Layout, containers & feedback

Type: grilling
Status: resolved
Blocked by: 02

## Question

Per-member verdict + shadcn mapping for:

- `Card` (8 lines) + `GlassCard` → shadcn `Card` (+ variant) or keep domain surface tokens.
- `Avatar` → shadcn `Avatar` (note `Avatar.test`).
- `ProgressBar` → shadcn `Progress`.
- `StatTile` → domain composition over shadcn `Card` (note `StatTile.test`).
- `SettingsSection` + `SettingsRow` (164 lines) → shadcn `Card`/list-row pattern; keep
  domain row (settings-row has no direct shadcn part). Note `SettingsRow.test`.
- `ImportRow` → domain row over shadcn primitives.
- `AppScreen` / `AuthScreen` / `ScreenHeader` / `StickyBar` → app-shell scaffolding; no
  shadcn equivalent — keep domain, but rebuild internal controls on shadcn. Confirm
  interaction with `use-sticky-header` (Utility-hooks 11).
- `EmptyState` → domain composition (shadcn `Empty` if the registry now ships one — verify
  via ticket 03).

For each: keep vs rebuild-on-primitive, compound idiom, token/animation reconciliation.

## Answer

- `Card` → **migrate** to shadcn `Card` (full compound: Header/Title/Description/Content/Footer).
- `GlassCard` → **keep (domain)** — glass tokens + backdrop-filter; expressed as a shadcn `Card`
  variant/wrapper.
- `Avatar` → **migrate** to shadcn `Avatar` (+ required `AvatarFallback`). Update `Avatar.test`.
- `ProgressBar` → **migrate** to shadcn `Progress`.
- `StatTile` → **keep (domain)** composing migrated `Card`. Update `StatTile.test`.
- `SettingsSection` + `SettingsRow` → **keep (domain)** — list-row pattern has no shadcn part;
  compose migrated `Card`/`Separator`. Update `SettingsRow.test`.
- `ImportRow` → **keep (domain)** over migrated primitives.
- `AppScreen` / `AuthScreen` / `ScreenHeader` / `StickyBar` → **keep (domain)** — app-shell
  scaffolding, no shadcn equivalent; rebuild only their inner controls on shadcn.
  `use-sticky-header` stays (11).
- `EmptyState` → **migrate** to shadcn `Empty` (the registry ships it) — keep a thin wrapper only
  if our illustration/copy slots differ from `Empty`'s.

Tokens/animation reconciled per conventions §4/§8 (our tokens, `motion`, no `dark:`).
