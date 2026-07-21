# shadcn Base-UI catalog & mapping table

Type: research
Status: resolved
Blocked by: 01

## Question

Produce the reference table the cluster tickets decide against: the current shadcn (Base UI
flavour) component catalog, and a row for **every** `shared/ui` item mapping it to an
equivalent or marking "no equivalent → domain / keep."

- Enumerate the shadcn Base-UI registry components available (Button, Input, Textarea,
  Field, Label, Badge, Switch, Tabs, ToggleGroup, Select, Combobox, Command, Dialog,
  AlertDialog, Sheet/Drawer, DropdownMenu, Popover, Avatar, Progress, Card, Separator,
  Tooltip, …) via the `shadcn` skill + registry.
- For each of the ~48 `shared/ui` components, record: candidate shadcn component, API-shape
  delta (flat wrapper → compound), and a first-cut hypothesis of verdict
  (migrate / rebuild-on-primitive / keep-domain / delete). The hypothesis is **not** the
  decision — the cluster grilling tickets own that — it just frames the session.
- Flag the "no shadcn equivalent" set explicitly (domain glyphs, gesture surfaces) so those
  clusters start from "keep unless justified," not "find a shadcn part."

Deliverable: a mapping-table markdown linked as an asset. AFK; can run in parallel with
ticket 02. Feeds all cluster tickets.

## Answer

Full deliverable: **[`assets/03-catalog.md`](../assets/03-catalog.md)** — the registry UI catalog
(~62 Base-flavour components; verified complete) plus a per-member mapping table for all 51
non-test `shared/ui` components, grouped by cluster (04–09) with candidate shadcn part, API-shape
delta, and a **first-cut verdict hypothesis** (explicitly not the decision — the cluster grilling
tickets own that).

Highlights:
- **Direct migrate candidates** (registry has a close part): `button`, `input`, `textarea`,
  `switch`, `card`, `avatar`, `progress`, `badge`(←`Chip`), and **`empty`**(←`EmptyState`, the
  registry does ship `Empty`).
- **Rebuild-on-primitive**: `SegmentedControl` (tabs vs toggle-group — 06 decides), `SortControl`,
  `PasswordField`, `AuthField`, `IconColorRow`, `Sheet`/`PromptSheet`, `OverflowMenuButton`.
- **No shadcn equivalent → keep-domain**: app-shell (`AppScreen`/`AuthScreen`/`ScreenHeader`/
  `StickyBar`), bulk-select (`SelectDot`/`SelectToolbar`/`select-actions`), `SpeedDial`,
  `EmojiField`, all cluster-09 domain glyphs, gesture surfaces (`SwipeRow`/`swipe-actions` → 10),
  `DropIndicator`.
- **Already on `@base-ui/react`** (migrate-or-keep, not re-point): `ActionSheet`, `Combobox`,
  `ConfirmDialog`, `FlyoutMenu`.

No new fog surfaced; the cluster tickets (04–11) already carve the space. This ticket only frames
them — it makes no verdicts.
