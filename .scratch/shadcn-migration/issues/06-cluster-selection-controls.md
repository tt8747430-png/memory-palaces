# Cluster: Selection & choice controls

Type: grilling
Status: resolved
Blocked by: 02

## Question

Per-member verdict + shadcn mapping for:

- `SegmentedControl` → shadcn `Tabs` or `ToggleGroup`? (decide which; it's used as a view
  switcher). Keep sliding-indicator animation?
- `Switch` → shadcn `Switch` (repo already exports `SwitchTrack` — reconcile).
- `Chip` → shadcn `Badge` (or `Toggle` where interactive).
- `SortControl` → shadcn `DropdownMenu`/`Select` (coordinate with Overlays 07).
- `Combobox` (already on `@base-ui/react`) → shadcn `Combobox`/`Command` — migrate to the
  recipe or keep the existing Base UI impl?
- `SelectDot` / `SelectToolbar` (+ `select-actions.tsx`) → multi-select UI; keep domain
  (bulk-select toolbar has no shadcn equivalent) but rebuild controls on shadcn.
- `IconColorRow` → domain picker on shadcn `ToggleGroup`/`RadioGroup`.

For each: compound idiom vs wrapper, animation survival, test impact
(`SegmentedControl.test`, `Switch.test`).

## Answer

- `SegmentedControl` → **rebuild on `ToggleGroup` (type single)**, **not `Tabs`** (Tabs implies
  tabpanels; this is a control). Adopt ToggleGroup for the roving-tabindex keyboard nav our
  hand-rolled `<button>`s lack; **keep the `motion` `layoutId` sliding pill** as a domain overlay.
  Update `SegmentedControl.test`. _(Flag: if the ToggleGroup DOM fights the shared-layout pill,
  fall back to keep-domain — the pill is the point.)_
- `Switch` → **migrate** to shadcn `Switch` (Base UI) for keyboard/a11y our
  `<button role="switch">` lacks. **Drop the `SwitchTrack` export** (its visual folds into the
  migrated Switch) unless a standalone usage exists — verify usages first. Update `Switch.test`.
- `Chip` → **migrate** — static → shadcn `Badge`; interactive → shadcn `Toggle`.
- `SortControl` → **rebuild** on the migrated `DropdownMenu` (07).
- `Combobox` → **keep (Base UI, hand-port)** — it's a well-built `@base-ui/react/menu` single-select
  with `field`/`bare` variants + careful mobile positioning; shadcn `Select` would lose that for
  little gain. Re-home to `primitives/`. _(Note: it's semantically a **Select**, not a Combobox —
  `UBIQUITOUS_LANGUAGE`; rename is out of scope here, flagged.)_
- `SelectDot` / `SelectToolbar` / `select-actions` → **keep (domain)** — bulk-select UI, no shadcn
  part; rebuild inner controls on migrated Button/Checkbox.
- `IconColorRow` → **rebuild** on shadcn `ToggleGroup`/`RadioGroup` (single-select color picker).
