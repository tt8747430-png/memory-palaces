# Ticket 03 — shadcn Base-UI catalog & mapping table

Reference the cluster grilling tickets (04–11) decide against. **Verdicts here are first-cut
hypotheses to frame each session, NOT decisions** — the cluster tickets own the real verdict.

Captured via `npx shadcn@latest search @shadcn` (471 items; the full **UI** set is below — verified
no `(ui)` items exist past page 1). Base-flavour source shape confirmed in
[`01-findings.md`](./01-findings.md).

## A. shadcn registry UI catalog (Base flavour available for all)

`accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group,
calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog,
drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd,
label, menubar, native-select, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner,
switch, table, tabs, textarea, toggle, toggle-group, tooltip`
(chat-oriented: `attachment, bubble, marker, message, message-scroller`; layout dir: `direction`).

Notables for us: **`empty`** exists (→ `EmptyState`), **`field`/`label`/`input-group`** for the form
pattern, **`sonner`** already our toast, `spinner`/`skeleton`/`separator` we don't yet have as parts.
No app-shell, no bulk-select, no radial-FAB, no emoji-picker, no domain-glyph equivalents.

## B. Mapping table — every `shared/ui` component (grouped by its cluster ticket)

Legend for hypothesis: **migrate** (adopt the shadcn part) · **rebuild** (rebuild our component on a
shadcn primitive) · **keep** (domain component, no shadcn part; may consume migrated primitives) ·
**delete**.

### Cluster 04 — Buttons
| Component | Candidate | API delta | Hypothesis |
|---|---|---|---|
| `button` | `button` | flat `variant(primary/secondary/ghost/destructive)`+`size(sm/md/lg)` → cva `variant(default/outline/secondary/ghost/destructive/link)`+`size(default/xs/sm/lg/icon*)`; keep `active:scale` | **migrate** (map primary→default; our tokens) |
| `IconButton` | `button` size=icon | our wrapper → `size="icon"` variant | **migrate**→thin wrapper |
| `GradeButtons` | compose `button` | SRS-grade row (repeated) | **keep** (on migrated Button) · `GradeButtons.test` |
| `OverflowMenuButton` | `dropdown-menu` trigger | our button+menu → compound trigger | **rebuild** (coord. 07) |
| `SpeedDial` | — (compose `button`) | radial FAB + motion; **no part** | **keep** (on Button) |
| `SocialButtons` | compose `button` | OAuth provider buttons | **keep/migrate** (compose Button) · `SocialButtons.test` |

### Cluster 05 — Form fields
| Component | Candidate | API delta | Hypothesis |
|---|---|---|---|
| `TextField` | `input` (+`field`/`label`) | flat props → `Field`+`Input` compound | **migrate** |
| `Textarea` | `textarea` | near 1:1 | **migrate** |
| `PasswordField` | `input` + reveal | keep reveal toggle | **rebuild** (wrapper) |
| `EmojiField` | — (`input`/`popover`) | emoji picker; **no part** | **keep** |
| `AuthField` | `field`+`input` | thin composition | **rebuild**/thin wrapper |
| `EditableTitle` | `input` + edit behavior | inline commit/cancel (119 ln) | **rebuild**/keep |

### Cluster 06 — Selection controls
| Component | Candidate | API delta | Hypothesis |
|---|---|---|---|
| `SegmentedControl` | `tabs` **or** `toggle-group` | view-switcher; keep sliding indicator | **rebuild** (06 picks which) · `SegmentedControl.test` |
| `Switch` | `switch` | reconcile our `SwitchTrack` export | **migrate** · `Switch.test` |
| `Chip` | `badge` (or `toggle`) | static→`Badge`; interactive→`Toggle` | **migrate** |
| `SortControl` | `dropdown-menu`/`select` | coord. 07 | **rebuild** |
| `Combobox` | `combobox`/`command` | already on `@base-ui/react` | **migrate** or keep |
| `SelectDot`/`SelectToolbar`/`select-actions` | — | bulk-select UI; **no part** | **keep** (controls on shadcn) |
| `IconColorRow` | `toggle-group`/`radio-group` | color picker | **rebuild** |

### Cluster 07 — Overlays (decides `vaul`)
| Component | Candidate | API delta | Hypothesis |
|---|---|---|---|
| `Sheet` | `drawer` (Base UI) | on `vaul` today → Base UI `Drawer` has native swipe + `VirtualKeyboardProvider` | **rebuild** on Base UI Drawer, **drop `vaul`** (07) |
| `PromptSheet` | compose Sheet | — | **rebuild** |
| `ActionSheet` | `sheet` + action list | already `@base-ui/react` | **keep**/rebuild |
| `ConfirmDialog` | `alert-dialog` | already `@base-ui/react`; repeated confirm | **keep** thin wrapper |
| `FlyoutMenu` | `dropdown-menu`/`popover` | already `@base-ui/react`; shared trigger for 04+06 | **migrate**/rebuild · `FlyoutMenu.test` |

### Cluster 08 — Layout & feedback
| Component | Candidate | API delta | Hypothesis |
|---|---|---|---|
| `Card` | `card` | 8-line surface → Card compound | **migrate** |
| `GlassCard` | `card` + variant | glass tokens | **keep**/rebuild |
| `Avatar` | `avatar` | needs `AvatarFallback` | **migrate** · `Avatar.test` |
| `ProgressBar` | `progress` | near 1:1 | **migrate** |
| `StatTile` | compose `card` | domain composition | **keep** · `StatTile.test` |
| `SettingsSection`+`SettingsRow` | `card`/list-row | settings-row **no part** (164 ln) | **keep** · `SettingsRow.test` |
| `ImportRow` | compose primitives | domain row | **keep** |
| `AppScreen`/`AuthScreen`/`ScreenHeader`/`StickyBar` | — | app-shell; **no part** | **keep** (controls on shadcn) |
| `EmptyState` | **`empty`** (exists) | registry ships `Empty` | **migrate**/rebuild |

### Cluster 09 — Domain glyphs (no shadcn equivalent — default **keep**)
| Component | Candidate | Hypothesis |
|---|---|---|
| `DeckCover`, `FolderGlyph` | — | **keep** (verify tokens; rounded-2xl) |
| `BadgeMedallion`, `TierPips` | — | **keep** |
| `SrsStatusChip` | may compose `badge` | **keep** (badge inside) · `SrsStatusChip.test` |
| `CollectionPreview`, `CardMaturityOverview`, `StudyOverviewCard` | container on `card` | **keep** (rebuild container) · `StudyOverviewCard.test` |
| `WordReveal` | — (motion) | **keep** · `WordReveal.test` |
| `DropIndicator` | — (drag/drop §10) | **keep** (don't disturb flicker fixes) |

### Gesture surfaces (verdict comes from Gesture-hooks ticket 10)
| Component | Candidate | Hypothesis |
|---|---|---|
| `SwipeRow` + `swipe-actions` | — (domain) | **keep-domain, rebuild gesture layer on `@use-gesture`** (10) |

## C. "No shadcn equivalent" set (start from *keep*, justify any change)

App-shell (`AppScreen`, `AuthScreen`, `ScreenHeader`, `StickyBar`), bulk-select (`SelectDot`,
`SelectToolbar`, `select-actions`), radial FAB (`SpeedDial`), emoji picker (`EmojiField`), all
domain glyphs (cluster 09), gesture surfaces (`SwipeRow`, `swipe-actions`), `DropIndicator`.

## D. Coverage note

51 non-test `shared/ui/*.tsx` components are all mapped above. `use-drag-to-dismiss.ts` (colocated
hook) is decided in the Gesture-hooks ticket (10), not here.
