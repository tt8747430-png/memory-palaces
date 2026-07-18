# ADR-0012: Route transitions on the View Transitions API; motion stays for gestures

**Status:** Accepted
**Date:** 2026-07-17
**Context:** binds the React rebuild (plan A.6 Motion row, P1+). Two animation systems coexist by
design; this records the boundary so it doesn't read as accident.

## Context

MOBILE_DESIGN §8 requires direction to encode hierarchy (forward moves inward, back moves outward),
and `motion` is the committed animation library (62 files on `main`). But route-boundary animation
is structurally where `motion` is weakest: `AnimatePresence` must keep the old page mounted during
exit (double render cost on low-end phones), and shared-element continuity across two route
components is fragile at best.

The browser View Transitions API (same-document) now ships in all three engines — Safari since 18,
which is already this project's zero-legacy iOS floor — and React Router 8 integrates it natively
(`viewTransition` on navigations, `useViewTransitionState`).

## Decision

**Between pages: the View Transitions API, driven through React Router 8.** Route changes animate
via `viewTransition`; direction (forward-in/back-out) is expressed with transition types in CSS;
shared-element morphs (deck tile → detail header) use `view-transition-name`. Snapshots run on the
compositor — the old page does not stay mounted.

**Within pages: `motion`, unchanged.** Everything the finger drives — sheet drags, swipe rows, card
physics, reward springs — stays on `motion`; the View Transitions API cannot scrub to a gesture.

The boundary is the route change. If an animation crosses a navigation, it's a view transition; if
it tracks a pointer or lives inside one surface, it's `motion`.

## Constraints

- **React's experimental `<ViewTransition>` component is not used** — RR8's stable integration +
  CSS only.
- `prefers-reduced-motion` collapses view transitions to a cut via one media query, preserving the
  token-layer guarantee.
- Fixed shell elements (bottom nav pill, status-bar cap) get their own `view-transition-name` so
  page snapshots don't drag them along.
- Browsers without same-document support get instant swaps — a graceful no-op, acceptable under the
  zero-legacy rule.
