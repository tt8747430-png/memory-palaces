# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **single-context**: one `CONTEXT.md` and one `docs/adr/` at the repo root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the domain glossary / ubiquitous language.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-no-ui-gating-of-room-unlocking.md
│   ├── 0002-streak-requires-daily-goal.md
│   └── …
└── src/
```

(If this repo ever grows multiple bounded contexts, add a `CONTEXT-MAP.md` at the root pointing to per-context `CONTEXT.md` files, and check `src/<context>/docs/adr/` for context-scoped decisions.)

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0003 (SRS maturity vs due queue) — but worth reopening because…_
