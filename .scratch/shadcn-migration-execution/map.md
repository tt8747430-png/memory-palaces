# Wayfinder map: shadcn-on-Base-UI migration — EXECUTION

Label: `wayfinder:map`

## Destination

The migration decided by the planning map is **landed in this branch**: every disposition in the
[handoff spec](../shadcn-migration/assets/16-handoff-spec.md) executed — primitives added &
adapted under `shared/ui/primitives/`, domain components re-pointed, widgets rebuilt, deps changed
(**+`class-variance-authority`**, **bump `@base-ui/react` ^1.5→^1.6**, **−`vaul`**), docs & tests
updated. `npm run typecheck && npm run lint && npm run test` green at every step.

## Notes

**⚠ This map CARRIES EXECUTION — the "plan, don't do" default is overridden.** Tickets here produce
**migrated code**, not decisions. Every verdict is already decided upstream; this effort makes **no
new UI decisions** — it implements them.

**Source of truth (do not re-decide):**
- [Handoff spec](../shadcn-migration/assets/16-handoff-spec.md) — the ordered sequence + full
  disposition table. Each ticket cites the section it executes.
- [Conventions & adaptation rules](../shadcn-migration/assets/02-conventions.md) — the canonical
  adaptation checklist every added component runs through (cva, `data-slot`, one `cn` at
  `@/shared/lib`, strip inline `dark:`/`focus-visible:ring`, token crosswalk, FSD placement).
- Reference recipe outputs captured from a real `init -b base -p nova`:
  [`base-button`](../shadcn-migration/assets/base-button.tsx),
  [`real-add-button`](../shadcn-migration/assets/real-add-button.tsx),
  [`base-dialog`](../shadcn-migration/assets/base-dialog.tsx),
  [`base-drawer`](../shadcn-migration/assets/base-drawer.tsx),
  [`base-sheet`](../shadcn-migration/assets/base-sheet.tsx),
  [`real-add-dialog`](../shadcn-migration/assets/real-add-dialog.tsx),
  [`real-components.json`](../shadcn-migration/assets/real-components.json),
  [`real-post-init-index.css`](../shadcn-migration/assets/real-post-init-index.css).

**Hard constraints every ticket honors (from planning map):**
- FSD layer boundaries are lint-enforced; cross-slice imports only through `index.ts` barrels.
  Primitives live in `shared/ui/primitives/` (inside the lowest layer) and are re-exported via
  `shared/ui/index.ts`.
- Semantic tokens only — no raw hex, no per-component `dark:`. Keep branded `theme.css` +
  `[data-theme='dark']`; never import shadcn's neutral `@theme`/`:root`/`.dark`.
- Strict TS: `import type` (`verbatimModuleSyntax`), `noUncheckedIndexedAccess`,
  `noUnusedLocals/Parameters`. TypeScript pinned `~6.0.3` (TS7 breaks eslint).
- Persisted data (RxDB schemas) untouched — UI-layer effort only.
- Keep our larger touch-target sizes over recipe defaults (`MOBILE_DESIGN`).

**Skills each session should consult:** `shadcn` (CLI/registry/docs), `find-docs`/`ctx7` for
`@base-ui/react`, `vercel-composition-patterns` (compound API), `docs/CODE_STYLE.md` §4/§5/§9/§10,
`docs/MOBILE_DESIGN.md`, `docs/UBIQUITOUS_LANGUAGE.md`.

**Verify gate (every ticket):** `npm run typecheck && npm run lint && npm run test`.

## Decisions so far

<!-- one line per closed ticket: what LANDED + link. Detail lives in the ticket's ## Answer. -->

- [01 — Scaffolding & deps](./issues/01-scaffolding-and-deps.md) — **landed, gate green.**
  `+class-variance-authority@^0.7.1`, `@base-ui/react ^1.5→^1.6` (`/drawer` confirmed); `vaul` kept
  til 11. `components.json` with repo aliases (ui→`@/shared/ui/primitives`, utils/lib/hooks→
  `@/shared/lib`, css→`src/styles/index.css`); `shared/ui/primitives/` barrel created; no
  `src/lib/utils.ts`. **Token crosswalk needs no CSS change** — `theme.css @theme inline` already
  maps every recipe color token onto the branded palette; shadcn neutral tokens stay reference-only;
  radius via our `rounded-control`/`rounded-card` (no parallel `--radius-*`). `shadcn` CLI not added
  — recipes hand-adapted from captured reference assets. **Unblocks 02 + 03.**
- [02 — Primitives A](./issues/02-primitives-a.md) — **landed, gate green (538 tests).** `primitives/`
  now holds `button`(cva+Base UI Button, primary→default, our sizes), `icon-button`(cva over Base UI
  Button, 5 domain variants), `input`(was TextField — renamed, 7 consumers repointed), `textarea`,
  `field`(Base UI Field compound: Field/Label/Control/Description/Error), `switch`(Base UI, kept API +
  presentational `SwitchTrack` for SettingsRow), `badge`(cva). `Chip`→thin wrapper over Badge. Old
  4 files deleted; `Switch.test`→`primitives/switch.test`. **Unblocks 04.**
- [03 — Primitives B](./issues/03-primitives-b.md) — **landed, gate green (538 tests).** Public:
  `card`(+`cardSurface`), `avatar`(kept lightweight img/initials — Base UI Avatar defers `<img>`
  past jsdom load), `Progress`(was ProgressBar — Base UI `Progress.Root` semantics + motion fill),
  `Empty`(was EmptyState). Renamed consumers repointed; old 4 files + test moved/deleted. Compound
  foundations built but **kept out of the barrel** (consumed same-slice by 04/05/07): `toggle-group`,
  `dropdown-menu`(styled Base UI Menu, cva item variants), `alert-dialog`(always-modal), `drawer`
  (Base UI native swipe + `VirtualKeyboardProvider` — **§4 drawer risk retired**, 05 drops
  `use-drag-to-dismiss` + iOS offset). ⚠ Pre-existing `FlashcardsPanel` flake noted (not ours).
  **Unblocks 04 (+ 05 for Drawer, 06 unaffected).**
- [04 — Domain rebuilds](./issues/04-domain-rebuilds.md) — **landed, gate green (538 tests).** Six
  rebuilt on ticket-03 foundations (same-slice deep imports): SegmentedControl→ToggleGroup+motion pill,
  IconColorRow→ToggleGroup, SortControl→DropdownMenu RadioGroup, FlyoutMenu→DropdownMenu (OverflowMenu
  unchanged), ConfirmDialog→AlertDialog (`role="alertdialog"`, no outside-dismiss — 2 consumer tests
  `dialog`→`alertdialog`), AuthField→Field+Input (PasswordField unchanged). Component tests passed
  unmodified (public APIs stable). **Unblocks 07 (+09).**
- [05 — Overlays → Drawer](./issues/05-overlays-sheet-to-drawer.md) — **landed, gate green (538 tests).**
  Sheet/ActionSheet/PromptSheet rebuilt on Base UI `Drawer`; `use-drag-to-dismiss` deleted; Sheet gains
  `initialFocus` passthrough (PromptSheet targets its input). **Gotcha fixed:** `VirtualKeyboardProvider`
  must sit *inside* `Drawer.Root` wrapping the Viewport (first pass wrapped Root → threw everywhere).
  `vaul` still installed (removed in 11). ⚠ **iOS on-device verification still owed:** keyboard-lift
  parity + swipe-dismiss not hijacking inner controls.
- [06 — SwipeRow gesture rebuild](./issues/06-swiperow-gesture-rebuild.md) — **landed, gate green (540
  tests).** `gestures.ts` generalized to bidirectional `SwipeGeometry` math (clamp/armedSide/
  resolveSwipeRelease), tested; SwipeRow event layer moved to `@use-gesture` `useDrag` (via
  `target` ref, `axis:'x'`+`pan-y`+`filterTaps`) — same recognizer as the decks. Added jsdom
  Pointer-Capture stub to test setup. ⚠ **on-device swipe-feel verification owed.**
- [07 — Widgets: Study](./issues/07-widgets-study.md) — **landed, gate green (540 tests).** Mostly
  transitive: 4 study sheets already on Drawer (via 05), widget consumes only migrated primitives.
  Real change: `ToggleRow` inline switch track → `SwitchTrack` primitive (dedup, 0 visual change).
  StudyDeck `@use-gesture` / faces `motion` / session-reward kept per spec.
- [08 — Widgets: Content](./issues/08-widgets-content.md) — **landed, gate green (540 tests).** No code
  change — all transitive: DeckContentEditor sheets on Drawer (05, the real "5th sheet"), ContentRows
  SwipeRow (06), FlyoutMenu/Input/Textarea/IconColorRow (04). **CardBrowser kept on Base UI Dialog +
  `@use-gesture`** (full-screen gallery; ticket-body "→Drawer" over-reach corrected against handoff §3).
  deck-tree §10 intact.
- [09 — Widgets: Profile/Home](./issues/09-widgets-profile-home.md) — **landed, gate green (540
  tests).** No code change — profile/home surfaces + kept glyphs consume only migrated primitives
  (Progress rename done in 03, SwipeRow in 06). `cardSurface` reconciled to `primitives/card` (03).
  Un-migrated-usage scan across the cluster: none.
- [10 — Widgets: Shell](./issues/10-widgets-shell.md) — **landed, gate green (540 tests).** No code
  change — bottom-nav/splash keep-domain (nav tabs + splash "Skip" ghost link intentionally bespoke),
  WordReveal kept, no old Button/IconButton imports to repoint. **All widget clusters done → 11 clear.**
- [11 — Docs, tests, dep cleanup](./issues/11-docs-tests-dep-cleanup.md) — **landed. MIGRATION CLOSED.**
  `vaul` removed (pkg + lockfile, no residual imports); `shadcn` never installed. Docs updated
  (MOBILE_DESIGN overlays/gestures, CODE_STYLE passive-listener rule, UBIQUITOUS_LANGUAGE Combobox=Select).
  **Final gate: typecheck clean · lint 0 errors · 540/540 tests · `npm run build` succeeds.** Net deps:
  +cva, base-ui ^1.5→^1.6, −vaul. ⚠ Owed: on-device iOS keyboard + swipe-feel verification (05/06).

## Not yet specified

<!-- The ordered sequence is fully known from the handoff spec; per-component adaptation detail is
resolved inside each ticket against the reference recipes. No open fog at the map level. -->

## Out of scope

- **RxDB schemas / persisted data** — untouched (UI-layer effort).
- **Non-overlapping additive deps** (`@dnd-kit`, `motion`, `sonner`, `@use-gesture`) — kept.
- **New UI decisions** — all verdicts are fixed upstream; this effort only implements them.
