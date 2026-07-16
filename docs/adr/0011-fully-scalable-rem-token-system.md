# ADR-0011: Fully scalable rem token system

**Status:** Accepted
**Date:** 2026-07-17
**Context:** binds the React rebuild's Task 3 (token restore). Amends the carried-over
`src/styles/tokens.css` scale.

## Context

PRODUCT.md and MOBILE_DESIGN.md both promise the app "respects the OS text-size setting" — but the
token scale inherited from `main` is px (`--ms-text-body: 14px`, px spacing/radii, a 430px column),
and px ignores the user's font-size preference entirely. Worse, the app was _inconsistently_ mixed:
the styling rule sends all layout spacing through Tailwind utilities, and Tailwind v4's spacing
scale is rem-based — so at a non-default text setting, utility-spaced gaps grew while token-sized
text, radii, and the nav stayed frozen.

## Decision

**Everything scales: the entire token scale converts from px to rem at a 16px base** —
`--ms-text-*`, `--ms-space-*`, `--ms-radius-*`, and `--ms-container-app` (430px → 26.875rem). At
default settings nothing changes visually; at a user-chosen text size the whole surface scales as
one system — text, spacing, radii, touch targets, the column — the way a native app honours Dynamic
Type. Larger text bringing larger touch targets is a feature: vision and motor accessibility needs
cluster.

**Three carve-outs stay px, deliberately:**

- **Hairline borders (1px)** — rem hairlines land on fractional pixels and render blurry.
- **Shadow offsets and blur radii** — depth cues, not content; scaling them reads as bloom.
- **`env(safe-area-inset-*)`** — hardware-defined, inherently px.

## Considered options

- _Type rem, spacing px_ — rejected: it preserves the incoherent mix, since Tailwind utilities are
  already rem.
- _Keep px_ — rejected: the docs' text-scaling promise stays false, and large-text users get nothing.

## Consequences

- A user who sets a _smaller_ browser font shrinks the whole app slightly, including touch targets —
  same trade native platforms make; accepted.
- The M3-era px geometry constants (80px nav bar, etc.) died with the Angular nav (see the plan's
  A.4); the glass pill's dimensions are expressed in rem like everything else.
