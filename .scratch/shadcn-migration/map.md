# Wayfinder map: shadcn-on-Base-UI migration

Label: `wayfinder:map`

## Destination

A complete, **decided disposition** for every `shared/ui` component, every custom UI
hook (`shared/lib`), and every widget — each marked **migrate to shadcn-on-Base-UI /
keep / delete / rebuild-on-primitive**, mapped to its shadcn equivalent, with sequencing
and risk notes. The assembled spec is handed off to a **separate execution effort**; this
map produces decisions, not migrated code.

## Notes

**Domain / foundation**
- "shadcn base ui" = shadcn/ui on the **Base UI** flavour: shadcn CLI + `components.json` +
  copy-in recipes that import from `@base-ui/react` (already a dep, `^1.5.0`). As of
  2026-07 Base UI is shadcn's default primitive layer. See `docs/adr/0001-shadcn-on-base-ui.md`.
- 4 components already sit directly on `@base-ui/react`: `ActionSheet`, `Combobox`,
  `ConfirmDialog`, `FlyoutMenu`.

**Guiding motivation**
- Prefer **well-tested, complete default implementations over bespoke code.** shadcn's
  maintained recipes cover more edge cases (a11y, focus-trap, keyboard-nav, positioning,
  dismiss) than what we hand-roll. In every ticket the **burden of proof is on keeping
  custom code** — the default is to adopt the library default. This is a lens, not a verdict:
  it does not override "decide each hook cold" below; it sets the disposition those cold
  decisions start from.

**Standing preferences for this effort (from charting grill)**
- Plan, don't do — decisions only; execution is a later effort.
- Custom hooks / "added functionality": **no blanket rule** — each hook decided cold in
  its own ticket (keep / delete / rebuild-as-wrapper). Do not assume a default verdict.
- Widgets are **first-class rework targets**, rebuilt on shadcn primitives — not merely
  re-pointed imports.
- Granularity: **clustered tickets, per-member verdicts**. Every member gets an explicit
  verdict inside its cluster's grilling session.
- Overlapping deps reconsidered **inside** the relevant ticket (Overlays decides `vaul`;
  Gesture hooks decides `@use-gesture`). Additive deps with no shadcn equivalent stay
  (`@dnd-kit`, `motion`). `sonner` stays (shadcn uses it).
- API surface: **adopt shadcn compound idioms** at call sites; keep a thin domain wrapper
  only where it encapsulates a genuinely repeated pattern. Aligns with `docs/CODE_STYLE.md`
  §4 + `vercel-composition-patterns`.

**Hard constraints every ticket must honor**
- FSD layer boundaries are **lint-enforced** (`eslint-plugin-boundaries`); cross-slice
  imports only through `index.ts` barrels. Where shadcn components physically live must not
  break this.
- Semantic tokens only — no raw hex, no per-component `dark:`. shadcn's raw CSS-var tokens
  must be mapped onto the existing token system (`data-theme` dark mode, Tailwind v4).
- Strict TS: `verbatimModuleSyntax` + `isolatedModules` (use `import type`),
  `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`. No `class-variance-authority`
  in the repo today.
- Persisted data (RxDB schemas) is out of scope and untouched — this is a UI-layer effort.

**Skills each session should consult**
- `/grill-with-docs` (grilling + domain-modeling) to resolve each ticket.
- `shadcn` skill for CLI/registry/component docs; `find-docs`/`ctx7` for `@base-ui/react`.
- `docs/CODE_STYLE.md` (§4 composition, §5 Tailwind, §9 animation, §10 drag/drop),
  `docs/MOBILE_DESIGN.md`, `docs/UBIQUITOUS_LANGUAGE.md`.
- `vercel-composition-patterns` for the compound-component API direction.

**Verification (execution effort, recorded here as the bar decisions must be executable against)**
- `npm run typecheck && npm run lint && npm run test` must stay green.

## Decisions so far

<!-- one line per closed ticket: gist + link. Detail lives in the ticket. -->

- [Ground the migration — shadcn init on Base UI](./issues/01-ground-the-migration.md) —
  ran a real Base-flavour `init -b base -p nova` + `add button dialog` in a throwaway project;
  captured `components.json`, post-init CSS, and the emitted files ([findings](./assets/01-findings.md)).
  Key: the styled `add` output is **inline-Tailwind + semantic-token** (same model as us) and every
  token already resolves in our `theme.css`, so **add-then-adapt is viable**; Base primitives match
  our `ActionSheet` API; `cn` is byte-identical (delete dup). Collisions to reconcile in 02: strip
  inline `dark:` (repo bans it) + `[data-theme]` vs `.dark`; don't import shadcn's neutral
  `@theme`/`:root`/`.dark`; keep Lexend not Geist; repoint aliases off `@/components`+`@/lib`; new
  deps `cva`/`tw-animate-css`/`shadcn`. Nothing landed on a repo branch. **Unblocks 02 + 03.**
- [shadcn Base-UI catalog & mapping table](./issues/03-catalog-and-mapping-table.md) —
  registry UI catalog (~62 Base components, verified complete) + first-cut mapping for all 51
  non-test `shared/ui` items grouped by cluster ([table](./assets/03-catalog.md)). Direct migrate:
  button/input/textarea/switch/card/avatar/progress/badge/**empty**; rebuild: SegmentedControl,
  Sheet, SortControl, PasswordField…; keep-domain (no part): app-shell, bulk-select, SpeedDial,
  EmojiField, glyphs, gesture surfaces. Hypotheses only — cluster tickets own verdicts. **Feeds 04–11.**
- [Conventions & adaptation rules](./issues/02-conventions-and-adaptation-rules.md) — the governing
  section ([spec](./assets/02-conventions.md)), approved: **adopt `cva`**, keep `data-slot`, one `cn`
  at `@/shared/lib`; **keep our branded `@theme` + `[data-theme]`, strip inline `dark:`/`focus-ring`,
  Lexend not Geist, don't import shadcn's neutral tokens**; primitives in `shared/ui/primitives/`
  with barrel exposure + repointed aliases; **add-then-adapt default** (hand-port only the 4
  Base-UI-native), `motion` not `tw-animate-css`. **Unblocks 04–11.**
- [Cluster 04 — Buttons](./issues/04-cluster-buttons.md) — `button` migrate→cva (shadcn variant
  names, **our** sizes + `active:scale`); `IconButton` thin wrapper; `GradeButtons`/`SpeedDial`/
  `SocialButtons` keep-domain; `OverflowMenuButton` → DropdownMenu trigger.
- [Cluster 05 — Form fields](./issues/05-cluster-form-fields.md) — adopt `Field`/`Input`/`Textarea`
  compound as the one field pattern; `TextField`/`Textarea` migrate; `PasswordField`/`AuthField`
  rebuild-wrapper; `EmojiField`/`EditableTitle` keep-domain.
- [Cluster 06 — Selection](./issues/06-cluster-selection-controls.md) — `SegmentedControl` rebuild on
  `ToggleGroup`(single)+keep motion pill; `Switch` migrate (drop `SwitchTrack`); `Chip`→Badge/Toggle;
  `Combobox` keep (Base UI); bulk-select keep-domain; `SortControl`/`IconColorRow` rebuild.
- [Cluster 07 — Overlays](./issues/07-cluster-overlays.md) — **DROP `vaul`**: Base UI `Drawer`
  (`@base-ui/react/drawer`) has native swipe + snap + `VirtualKeyboardProvider` (replaces vaul's
  iOS `repositionInputs`). `Sheet`/`PromptSheet`/`ActionSheet` rebuild on Base UI Drawer (→
  `use-drag-to-dismiss` deleted, 10); `ConfirmDialog` keep thin wrapper (AlertDialog);
  `FlyoutMenu`→DropdownMenu (shared trigger). ⚠ bump `@base-ui/react` ^1.5→^1.6 for `/drawer`.
- [Cluster 08 — Layout/feedback](./issues/08-cluster-layout-and-feedback.md) — `Card`/`Avatar`/
  `ProgressBar`/`EmptyState` migrate; `GlassCard`/`StatTile`/`Settings*`/`ImportRow`/app-shell
  keep-domain.
- [Cluster 09 — Domain glyphs](./issues/09-cluster-domain-glyphs.md) — all **keep-domain**
  (consume migrated primitives only); `SrsStatusChip` composes Badge; containers rebuild on Card.
- [Cluster 10 — Gesture hooks](./issues/10-cluster-gesture-hooks.md) — **`use-drag-to-dismiss`
  deleted** (Base UI Drawer native swipe); **`@use-gesture` KEEP** (out-of-scope-additive — it's a
  gesture *recognizer* with `filterTaps`+velocity that `motion` doesn't replace and Base UI Drawer
  doesn't cover for StudyDeck/CardBrowser; hand-rolling it contradicts "library over bespoke").
  **`SwipeRow` keep-domain but rebuild its gesture layer onto `@use-gesture`** (consistency — it
  hand-rolls axis-lock/fling; adopts tested `gestures.ts` commit math, zero new dep). Keep
  `use-long-press`/`gestures`/`haptics`/`shake`/`speech`. `use-drag-to-dismiss` deletion needs a
  `MOBILE_DESIGN`/§10 note.
- [Cluster 11 — Utility hooks](./issues/11-cluster-utility-hooks.md) — all **keep, untouched**
  (`use-optimistic-patch`, `use-sortable-sensors`, `use-auto-select`, `use-keyboard-pin`,
  `use-sticky-header`, `motion`).
- [Widgets 12 Study](./issues/12-widgets-study.md) — rebuild on migrated primitives; **owns 4/5
  `Sheet` sites → Base UI Drawer**; `StudyDeck` **keeps** `@use-gesture`; faces/overlays keep
  (motion); `session-reward` untouched.
- [Widgets 13 Content](./issues/13-widgets-content.md) — `CardBrowser` **keeps** `@use-gesture`,
  `FlyoutMenu`→DropdownMenu; `deck-tree` keeps `@dnd-kit`+`DropIndicator`+`use-optimistic-patch`
  (§10 intact); `folder-form` on Field/IconColorRow; `SelectModeBar` keep.
- [Widgets 14 Profile/Home](./issues/14-widgets-profile-home.md) — compose migrated Avatar/Progress/
  Card/Chip/IconButton + kept glyphs (09)/GlassCard/StickyBar/SwipeRow (gesture layer → `@use-gesture`,
  10); `cardSurface` helper to reconcile with Card.
- [Widgets 15 Shell](./issues/15-widgets-shell.md) — `bottom-nav`/`splash` keep-domain (no nav
  part); inner controls on migrated Button; `WordReveal` kept.
- [16 — Handoff spec assembly](./issues/16-handoff-spec-assembly.md) — **DESTINATION REACHED.** The
  execution [handoff spec](./assets/16-handoff-spec.md) folds every verdict into: dep changes (+cva,
  bump base-ui, **−vaul**; keep `@use-gesture`), ordered sequence, full disposition table, risks,
  test-migration, doc updates. Nothing left to decide.

## Not yet specified

<!-- in-scope fog; graduates as the frontier advances -->

**✅ Map complete — destination reached.** All tickets 01–16 are resolved; no fog, no open tickets,
nothing left to decide. The [handoff spec](./assets/16-handoff-spec.md) is ready for the separate
**execution effort** to implement (it will land real shadcn code on a branch — this map produced
only decisions). Testing strategy folded into conventions §Testing + per-cluster notes + ticket 16.

## Out of scope

- **RxDB schemas / persisted data** — not a UI concern; untouched.
- **Non-overlapping additive deps** (`@dnd-kit`, `motion`, `sonner`) — kept, not reconsidered.
