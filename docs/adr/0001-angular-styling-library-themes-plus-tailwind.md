# ADR-0001: Angular migration styling — library themes + Tailwind utilities

**Status:** Accepted
**Date:** 2026-07-14
**Context:** Migration of Mindscape (React 19 + Vite PWA) to Angular v20+ with Angular Material + PrimeNG. Nothing is deleted during migration; the Angular app is built alongside the React app in this repo.

## Decision

Styling in the Angular app is split into three strictly-scoped layers:

1. **Components** come from Angular Material + PrimeNG and are styled exclusively through their theme systems — Material M3 system variables and the PrimeNG design-token preset — both fed by the existing `--sw-*` semantic palette. Dark mode remains a single `data-theme` attribute driving both theme systems.
2. **Layout and spacing** use Tailwind v4 utilities in templates — nothing else. No colors via Tailwind except semantic token-mapped classes; no re-skinning of library components with utilities.
3. **Component-scoped CSS files** exist only for what neither system expresses (e.g., a keyframe animation), preserving the spirit of the docs/instructions.md separation rule (logic in ts, styles in css, template in html).

## Alternatives considered

**Pure Material + PrimeNG theming (no Tailwind).** Rejected: it doesn't remove a styling system, it replaces a maintained one with hand-written layout CSS across ~30 bespoke mobile-first pages (glass cards, 430px column, safe areas, thumb-zone layouts). That layer is where drift happens — duplicated flexbox, magic-number spacing, dead encapsulated CSS — and would inevitably grow an in-house utility/mixin layer, exactly the kind of own-implementation the migration aims to eliminate. Tailwind is the maintained library for that layer, with a constrained scale and automatic purging; the pairing with PrimeNG is officially supported (`tailwindcss-primeui`).

**Trade-off accepted:** three styling stacks (Material theming, PrimeNG tokens, Tailwind) must stay version-compatible, and contributors follow a discipline rule: components from libraries, layout from utilities.
