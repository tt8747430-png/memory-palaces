---
status: accepted
---

# Adopt shadcn/ui on the Base UI primitive layer for shared/ui

We are migrating Mindscape's hand-rolled `shared/ui` component library (and widgets) to
**shadcn/ui using its Base UI flavour** — the shadcn CLI, `components.json`, and copy-in
recipes that import from `@base-ui/react` (already a dependency, `^1.5.0`), rather than the
classic Radix flavour or continuing to hand-maintain every primitive. **The motivation is to
lean on well-tested, complete default implementations instead of bespoke code**: shadcn's
recipes are more thoroughly tested and cover more edge cases (accessibility, focus-trap,
keyboard-nav, positioning, dismiss) than what we maintain by hand. We keep a single primitive
foundation — 4 components already sit directly on `@base-ui/react`, and as of 2026-07 Base UI
is shadcn's default primitive layer, so its recipes import from the exact package we already
ship.

## Considered Options

- **shadcn on Base UI (chosen)** — one primitive layer, matches the 4 existing Base UI
  components, no second library to reconcile.
- **shadcn on Radix** — more community examples, but introduces `@radix-ui/*` alongside the
  `@base-ui/react` we already depend on: two foundations to maintain.
- **Raw Base UI, no shadcn CLI** — keep hand-writing on `@base-ui/react` (the current
  status quo for 4 components); rejected because hand-written components are less tested and
  less complete than shadcn's maintained default recipes, and leaning on those defaults is
  the whole point of the migration.

## Consequences

- shadcn's conventions (`class-variance-authority`, `data-slot`, its own `cn`, raw CSS-var
  tokens, default `components/ui` path) must be reconciled with this repo's constraints —
  lint-enforced FSD boundaries, semantic-tokens-only (no raw hex / no per-component `dark:`),
  the existing `cn`, and no `cva` today. Those adaptation rules are decided in the migration's
  Conventions ticket, not here.
- Additive behavior with no shadcn equivalent (swipe, long-press, haptics, drag-to-dismiss)
  is decided per-hook and is **not** implied to be removed by this decision.
