# 01 — Scaffolding & dependency setup

Type: task
Blocked by: —
Status: resolved

## Question

Execute handoff spec §0 (dep changes) + §1 (scaffolding) so every later ticket can `add`/adapt
recipes against the repo's conventions.

- Add `class-variance-authority`; **bump `@base-ui/react` `^1.5.0 → ^1.6.0`** (needed for the
  `Drawer` primitive in ticket 05). **Keep `vaul` for now** — it is removed only after the
  Sheet→Drawer sites land (ticket 11).
- Create `components.json` with repo aliases: `ui→@/shared/ui/primitives`,
  `components→@/shared/ui`, `lib`/`utils`/`hooks→@/shared/lib`, `css→src/styles/index.css`
  (style `base-nova`, `rsc:false`, `tsx:true`, baseColor `neutral`, cssVariables true, icon `lucide`).
- Do **not** create `src/lib/utils.ts` (none exists; `cn` stays at `@/shared/lib`).
- Create `src/shared/ui/primitives/` (with a barrel if useful).
- Token crosswalk (conventions §4): optionally adopt `--radius-*` onto `--p-radius-*`; **do not**
  import shadcn's neutral `@theme`/`:root`/`.dark`; keep Lexend + `[data-theme='dark']`.

Verify gate green.

## Answer

**Landed** (verify gate green: typecheck clean, lint 0 errors, 538/538 tests pass):

- **Deps:** `class-variance-authority@^0.7.1` added; `@base-ui/react` bumped `^1.5.0 → ^1.6.0`
  (`1.6.0` is latest; `/drawer` subpath confirmed resolvable — even 1.5 exposed it, so the bump is
  low-risk). `vaul@^1.1.2` deliberately kept (removed in ticket 11). No `tw-animate-css`, no
  `@fontsource-variable/geist`, no `radix-ui`. `shadcn` CLI package **not** added — recipes are
  hand-adapted from the captured reference assets rather than run through the CLI (the repo has no
  network/registry access wired, and the reference outputs already give byte-level recipes).
- **`components.json`** created at repo root with repo aliases: `components→@/shared/ui`,
  `ui→@/shared/ui/primitives`, `lib`/`utils`/`hooks→@/shared/lib`, `css→src/styles/index.css`,
  style `base-nova`, `rsc:false`, baseColor `neutral`, icon `lucide`.
- **`src/shared/ui/primitives/index.ts`** created (empty `export {}` barrel; fills as primitives
  land, re-exposed through `src/shared/ui/index.ts`). No `src/lib/utils.ts` created (none existed).
- **Token crosswalk (conventions §4) — confirmed, no CSS change needed.** Our `theme.css`
  `@theme inline` already maps every color token the recipes reference (`--color-primary`,
  `--color-primary-foreground`, `--color-secondary`, `--color-muted`, `--color-border`,
  `--color-input`, `--color-ring`, `--color-destructive`, `--color-card`, `--color-popover`, …) onto
  the branded palette, so `bg-primary`/`text-primary-foreground`/`border-border` resolve out of the
  box. `real-post-init-index.css` (shadcn's neutral `:root`/`.dark`) is reference-only and is **not**
  imported. **Radius:** did not add a parallel shadcn `--radius-sm/md/lg` scale; per-component
  adaptation swaps recipe radius utilities to our `rounded-control`/`rounded-card` tokens. `Lexend`
  kept; dark mode stays `[data-theme='dark']`.
