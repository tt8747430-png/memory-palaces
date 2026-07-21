# Handoff spec — shadcn-on-Base-UI migration

The assembled disposition for the **execution effort**. Every row folds a decision already made on
the map (source ticket cited); this spec makes **no new decisions**. Verify gate at every step:
`npm run typecheck && npm run lint && npm run test` must stay green.

## 0. Dependency changes (net)

| Action | Package | Why / source |
|---|---|---|
| **add** | `class-variance-authority` | recipes use `cva` (02) |
| **bump** | `@base-ui/react` `^1.5.0 → ^1.6.0` | Base UI `Drawer` primitive (07) |
| **remove** | `vaul` | superseded by Base UI `Drawer` + `VirtualKeyboardProvider` (07) |
| **do NOT add** | `tw-animate-css` | use `motion` (02 §8) |
| **do NOT add** | `@fontsource-variable/geist` | keep Lexend (02 §4) |
| **do NOT add** | `radix-ui` | Base flavour (01) |
| **maybe drop** | `shadcn` | only kept if a component needs `shadcn/tailwind.css` helpers; default drop (02 §8) |
| **keep** | `@use-gesture/react`, `@dnd-kit/*`, `motion`, `sonner` | out-of-scope-additive (no Base UI equivalent for `StudyDeck`/`CardBrowser` card gestures) |

## 1. Scaffolding (do first — conventions 02)

- `components.json` `aliases`: `ui→@/shared/ui/primitives`, `components→@/shared/ui`,
  `lib`/`utils→@/shared/lib`, `hooks→@/shared/lib`; `css→src/styles/index.css`.
- Delete the generated `src/lib/utils.ts`; all imports use `@/shared/lib` `cn`.
- **Do not** import shadcn's `@theme`/`:root`/`.dark` — keep `theme.css` branded tokens +
  `[data-theme='dark']`. Optionally adopt `--radius-*` scale; skip `--sidebar-*`; chart later.
- **Adaptation checklist** applied to every added component: strip inline `dark:` + `focus-visible:ring`;
  `motion`/Base-UI transitions not `tw-animate-css`; `import type`; drop `"use client"`; land in
  `shared/ui/primitives/` + barrel-export public ones.

## 2. Ordered sequence

1. **Scaffolding** (§1).
2. **Primitives** → `shared/ui/primitives/` + barrel: Button, Input, Textarea, Field/Label, Switch,
   Badge, Card, Avatar, Progress, Empty, ToggleGroup, DropdownMenu, AlertDialog, **Drawer** (Base UI).
3. **Re-point domain components** (keep set) onto the new primitives.
4. **Widgets** (12–15) — incl. the Sheet→Drawer sites (`StudyDeck`/`CardBrowser` keep `@use-gesture`).
5. **Docs + tests** (§5, §6).

## 3. Disposition table

**Primitives — migrate (adopt recipe):** `button`(04) · `Input`/`Textarea`/`Field`/`Label`(05) ·
`Switch`(06) · `Chip`→`Badge`/`Toggle`(06) · `Card`(08) · `Avatar`(08) · `ProgressBar`→`Progress`(08) ·
`EmptyState`→`Empty`(08).

**Rebuild on a primitive:** `IconButton`→Button icon(04) · `OverflowMenuButton`→DropdownMenu(04) ·
`SegmentedControl`→ToggleGroup + motion pill(06) · `SortControl`→DropdownMenu(06) ·
`IconColorRow`→ToggleGroup(06) · `PasswordField`→Input+reveal(05) · `AuthField`→Field(05) ·
`Sheet`/`PromptSheet`/`ActionSheet`→**Base UI Drawer**(07) · `FlyoutMenu`→DropdownMenu(07) ·
`ConfirmDialog`→AlertDialog thin wrapper(07).

**Keep-domain (consume migrated primitives):** `GradeButtons`/`SpeedDial`/`SocialButtons`(04) ·
`EmojiField`/`EditableTitle`(05) · `Combobox`(Base UI, 06) · `SelectDot`/`SelectToolbar`/
`select-actions`(06) · `GlassCard`/`StatTile`/`SettingsSection`/`SettingsRow`/`ImportRow`/`AppScreen`/
`AuthScreen`/`ScreenHeader`/`StickyBar`(08) · all glyphs `DeckCover`/`FolderGlyph`/`BadgeMedallion`/
`TierPips`/`SrsStatusChip`/`CollectionPreview`/`CardMaturityOverview`/`StudyOverviewCard`/`WordReveal`/
`DropIndicator`(09).

**Keep-domain, rebuild internals:** `SwipeRow`/`swipe-actions`(10) — domain surface kept, but the
gesture layer moves off raw pointer events onto `@use-gesture` (`useDrag`) + tested `gestures.ts`
commit math (zero new dep; retires the inline `clampOffset` and gives dead `gestures.ts` a consumer).

**Delete:** `use-drag-to-dismiss`(10 — replaced by Drawer native swipe).

**Hooks — keep:** `use-long-press`, `gestures`, `haptics`, `shake`, `speech`(10) ·
`use-optimistic-patch`, `use-sortable-sensors`, `use-auto-select`, `use-keyboard-pin`,
`use-sticky-header`, `motion`(11).

**Widgets:** Study(12) rebuild on primitives, 4 Sheets→Drawer, `StudyDeck` **keeps** `@use-gesture`,
faces keep, `session-reward` untouched · Content(13) `CardBrowser` **keeps** `@use-gesture`,
`FlyoutMenu`→DropdownMenu, `deck-tree` §10-intact + `@dnd-kit`, `folder-form` Field/IconColorRow,
`SelectModeBar` keep · Profile/Home(14) migrated Avatar/Progress/Card/Chip/IconButton + kept glyphs/GlassCard/
StickyBar/SwipeRow, reconcile `cardSurface` · Shell(15) `bottom-nav`/`splash` keep-domain.

## 4. Risks / watch-items

- **Hand-port (already Base UI):** `ActionSheet`, `ConfirmDialog`, `FlyoutMenu`, `Combobox` — adapt, don't `add`.
- **§10 drop-flicker surfaces:** `deck-tree`, `ReorderableList`, `DropIndicator`, `use-optimistic-patch` — verify no regression.
- **`@base-ui/react` bump** for `/drawer` — confirm the Drawer API in the installed version before Sheet rework.
- **iOS:** `Drawer.VirtualKeyboardProvider` must preserve the keyboard behavior vaul's `repositionInputs` gave — test on iOS.
- **`@use-gesture` kept** (out-of-scope-additive) — `StudyDeck`/`CardBrowser` gestures rely on `filterTaps` + velocity that have no Base UI equivalent; do **not** hand-roll them onto raw pointer events. `SwipeRow` consolidates onto the same recognizer (10).
- **`SwipeRow` gesture rebuild** is behavior-sensitive — verify swipe-to-action feel (arm/commit thresholds, fling, tap-vs-drag) is unchanged; `gestures.test` covers the commit math it now adopts.
- **Tokens:** never overwrite branded values with shadcn's neutral defaults; check contrast in light **and** dark.
- **Sizes:** keep our larger touch-target sizes over recipe defaults (`MOBILE_DESIGN`).

## 5. Test migration (conventions §Testing)

Update colocated `*.test.tsx` from flat → compound APIs as each cluster lands; keep the verify gate
green each step. Named tests to touch: `button`/`GradeButtons`/`SocialButtons`/`Switch`/
`SegmentedControl`/`Avatar`/`StatTile`/`SettingsRow`/`SrsStatusChip`/`StudyOverviewCard`/`WordReveal`/
`EmojiField`/`FlyoutMenu`/`use-long-press`/`gestures`/`use-optimistic-patch`.

## 6. Doc updates

- `docs/MOBILE_DESIGN.md` + `docs/CODE_STYLE.md` §10: Base UI `Drawer` swipe replaces `vaul`; the
  `SwipeRow` motion pattern replaces `@use-gesture`; document `VirtualKeyboardProvider` for iOS.
- `docs/UBIQUITOUS_LANGUAGE.md`: note `Combobox` is really a Select (optional rename, out of scope here).
