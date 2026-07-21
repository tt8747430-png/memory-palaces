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

## Not yet specified

<!-- The ordered sequence is fully known from the handoff spec; per-component adaptation detail is
resolved inside each ticket against the reference recipes. No open fog at the map level. -->

## Out of scope

- **RxDB schemas / persisted data** — untouched (UI-layer effort).
- **Non-overlapping additive deps** (`@dnd-kit`, `motion`, `sonner`, `@use-gesture`) — kept.
- **New UI decisions** — all verdicts are fixed upstream; this effort only implements them.
