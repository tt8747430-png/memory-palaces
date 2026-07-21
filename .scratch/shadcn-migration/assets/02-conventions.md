# Ticket 02 — Conventions & adaptation rules (governing spec section)

Every cluster (04–11) follows these and **cites them instead of re-deciding**. Decided against the
real CLI output in [`01-findings.md`](./01-findings.md). Approved by the learner.

## 1. `class-variance-authority` — **adopt**
Add `class-variance-authority` and keep generated `cva` calls as-is; type props with
`VariantProps<typeof xVariants>`. Rationale: it's what the recipes ship, keeps future
`add --diff` merges clean, tiny dep. This **replaces** the repo's `Record<Variant,string> + cn`
pattern in *migrated* components (e.g. `button.tsx` is rewritten to cva). Components with no
variants need no cva.

## 2. `data-slot` — **keep**
Every migrated component retains `data-slot`. Free styling/testing hooks; preserves upstream diff.

## 3. `cn` — **one `cn`, at `@/shared/lib`**
The generated `src/lib/utils.ts` is byte-identical → **don't create it**; point every migrated
import at `@/shared/lib`. `components.json` `aliases.utils`/`aliases.lib` → `@/shared/lib`.

## 4. Token crosswalk
- **Keep our `theme.css` `@theme inline`** (branded palette). **Do NOT import shadcn's generated
  `@theme`/`:root`/`.dark` blocks** — our `--color-*` names already satisfy the recipes.
- **Dark mode stays `[data-theme='dark']`.** **Strip inline `dark:` utilities** from every adopted
  component (repo bans per-component `dark:`); theming rides the token *values*, not `dark:` variants.
- **Strip `focus-visible:ring-*` / `focus-visible:border-ring`** from recipes; rely on the global
  `:focus-visible` box-shadow in `index.css`.
- **New families:** map the recipe's `--radius-sm/md/lg` onto our `--p-radius-*` (radius-control/card);
  **skip `--color-sidebar-*`** (no sidebar); add `--color-chart-*` **only when a chart lands**.
- **Font:** keep **Lexend** (`--font-sans` ours). Drop `@fontsource-variable/geist`; point/`drop`
  `--font-heading` at Lexend.

## 5. FSD placement
- Migrated primitives live in **`src/shared/ui/primitives/`** (new subfolder), one kebab file each
  (`button.tsx`, `dialog.tsx`, …).
- **Public API:** re-export primitives meant for cross-slice use through the existing
  `src/shared/ui/index.ts` barrel. Cross-slice imports stay barrel-only; lint boundaries are
  unaffected (primitives sit inside `shared/ui`, the lowest layer).
- `components.json` `aliases`: `components→@/shared/ui`, `ui→@/shared/ui/primitives`,
  `lib→@/shared/lib`, `utils→@/shared/lib`, `hooks→@/shared/lib`; `css→src/styles/index.css`.
- Existing hand-authored `shared/ui/*.tsx` domain components stay put; they consume primitives.

## 6. TS strict fix-ups (mechanical, every file)
`import type` for type-only imports (`verbatimModuleSyntax`); **strip `"use client"`** (no RSC);
keep `import * as React` only where `React.ComponentProps` is used; satisfy
`noUnusedLocals/Parameters` + `noUncheckedIndexedAccess`.

## 7. Add-then-adapt (**default**) vs hand-port
**Default: `shadcn add <c>` then run the adaptation checklist.** Deviate to **hand-port on
`@base-ui/react`** only where the component is already on Base UI and heavily customized
(`ActionSheet`, `ConfirmDialog`, `FlyoutMenu`, `Combobox`) or needs deep domain behavior/motion.

**Adaptation checklist (canonical):**
1. Repoint `cn` → `@/shared/lib`; fix import aliases to `@/shared/ui/primitives` etc.
2. Strip inline `dark:` and `focus-visible:ring-*`.
3. Remove `tw-animate-css` utilities → motion / Base UI transitions (§8); remove `"use client"`.
4. Move file into `shared/ui/primitives/`; add barrel export if public.
5. Re-add our micro-interactions where the domain wrapper wants them (`active:scale`, haptics).
6. `import type` fix-ups; update colocated `*.test.tsx` to the compound API.

## 8. Animation
Standard = **`motion`** (repo §9, honors `prefers-reduced-motion`). Rewrite recipe
`tw-animate-css` utilities (`data-open:animate-in`, fade/zoom) as motion **or** Base UI
`data-[starting-style]`/`data-[ending-style]` transitions (as `ActionSheet` already does). **Do not
add `tw-animate-css`.** **Drop the `shadcn` package** (`shadcn/tailwind.css`) unless a specific
adopted component depends on its base helpers — record any exception.

## Testing (feeds the "testing strategy" fog)
Colocated `*.test.tsx` asserting the flat API get updated to the compound idiom as each cluster
migrates; keep `typecheck && lint && test` green per CLAUDE.md.
