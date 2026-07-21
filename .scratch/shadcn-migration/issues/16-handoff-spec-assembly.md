# Handoff spec assembly — the destination

Type: task
Status: resolved
Blocked by: 12, 13, 14, 15

## Question

Fold every verdict into the single execution spec the **separate execution effort** implements —
this reaches the map's destination. Assemble from: conventions (02), catalog (03), primitive/hook
clusters (04–11), widget clusters (12–15).

Produce:
- **Ordered migration sequence:** (1) land shadcn scaffolding per 02 — repointed `components.json`,
  `cn` dedupe, token/alias setup, no neutral `@theme`/Geist; (2) primitives (04–08 migrate set);
  (3) domain components (keep set) re-pointed onto primitives; (4) widgets (12–15).
- **Per-component disposition table** (migrate / rebuild / keep / delete) — the full assembled list.
- **Risk notes:** the 4 already-on-Base-UI components (hand-port), `vaul` dropped / `@use-gesture` kept,
  §10 drop-flicker surfaces, per-cluster test rewrites (conventions §Testing).
- **Verify gate:** `npm run typecheck && npm run lint && npm run test` green at each step.

Output: the handoff spec (linked asset). AFK assembly of decided material — no new decisions.

## Answer

Assembled: **[`assets/16-handoff-spec.md`](../assets/16-handoff-spec.md)** — the execution effort's
plan, folding every map decision (02 conventions, 03 catalog, 04–11 clusters, 12–15 widgets) into:
dependency changes (add `cva`, bump `@base-ui/react`, **remove `vaul`**; keep `@use-gesture`), a first-do
scaffolding step, the ordered sequence (scaffolding → primitives → domain re-point → widgets → docs/
tests), the full per-component disposition table (migrate / rebuild / keep / delete), risk/watch-items,
the test-migration approach, and the doc updates.

**This reaches the map's destination** — a complete, decided disposition for every `shared/ui`
component, custom hook, and widget, handed off to the execution effort. No decisions remain.
