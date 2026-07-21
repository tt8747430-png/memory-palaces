# Conventions & adaptation rules — how shadcn output is reconciled with this repo

Type: grilling
Status: resolved
Blocked by: 01

## Question

The governing section of the spec. Against the real CLI output from ticket 01, decide the
rules **every** cluster ticket must follow so migrated components are idiomatic *for this
repo*, not raw shadcn drops. Each sub-decision gets an explicit verdict:

- **`class-variance-authority`** — adopt `cva` as shadcn ships it, or keep the repo's
  current `Record<Variant, string>` + `cn()` pattern (see `shared/ui/button.tsx`)? If
  keeping, define the mechanical rewrite from generated `cva` calls.
- **`data-slot` attributes** — keep, drop, or keep-selectively? (styling/testing implications)
- **`cn` reconciliation** — shadcn generates its own `lib/utils` `cn`. Point generated code
  at the existing `@/shared/lib` `cn` (clsx + tailwind-merge) and delete the duplicate.
- **Token mapping** — shadcn emits raw CSS-var tokens (`--background`, `--primary`, …) and
  assumes a `.dark` class. Map these onto the existing semantic-token system + `data-theme`
  dark mode with **no raw hex and no per-component `dark:`** (`docs/CODE_STYLE.md` §5).
  Produce the token crosswalk.
- **FSD placement** — where do shadcn components physically live so lint boundaries stay
  green? Options: inside `src/shared/ui/` (same layer, adjust `components.json` `aliases`),
  a `src/shared/ui/primitives/` subfolder, or elsewhere. Decide barrel/public-API exposure
  (`shared/ui/index.ts`) so cross-slice imports still go through the barrel.
- **TS strictness** — generated code must satisfy `verbatimModuleSyntax` (`import type`),
  `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`. Note the standard fix-ups.
- **CLI vs hand-port** — for each future component: `shadcn add` then adapt, or hand-write
  on `@base-ui/react` following the recipe? Set the default and when to deviate.
- **Animation** — `tw-animate-css` vs the repo's `motion` + `docs/CODE_STYLE.md` §9 rules.

Output: a "Conventions" section of the handoff spec that later tickets cite instead of
re-deciding. Blocks all cluster tickets (04–11).

## Answer

Governing conventions decided against ticket-01 reality and **approved by the learner**. Full
section: **[`assets/02-conventions.md`](../assets/02-conventions.md)**. Verdicts:

1. **`cva` — adopt** (add `class-variance-authority`; replaces our `Record<Variant,string>` in
   migrated components).
2. **`data-slot` — keep.**
3. **`cn` — one, at `@/shared/lib`**; delete the byte-identical generated dup.
4. **Tokens** — keep our branded `theme.css` `@theme`; do **not** import shadcn's neutral
   `@theme`/`:root`/`.dark`; keep `[data-theme='dark']` and **strip inline `dark:`** + `focus-ring`;
   map `--radius-*`, skip `--sidebar-*`, chart later; **Lexend not Geist**.
5. **FSD** — primitives in `src/shared/ui/primitives/`, public ones via `shared/ui/index.ts`;
   `components.json` aliases repointed to `shared/*`.
6. **TS** — `import type`, strip `"use client"`, no-unused.
7. **Add-then-adapt is the default** (canonical adaptation checklist in the asset); hand-port only
   for the 4 already-on-Base-UI/customized components.
8. **Animation** — `motion` (not `tw-animate-css`); drop the `shadcn` pkg unless a component needs it.

**Unblocks all cluster tickets (04–11).**
