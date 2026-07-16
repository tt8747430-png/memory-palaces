# ADR-0010: The mobile viewport, keyboard, and drawer contract

**Status:** Accepted
**Date:** 2026-07-17
**Context:** binds the React rebuild (`docs/superpowers/plans/2026-07-16-return-to-react.md`, A.4/P1).
Keeps spec 07-14's decision, replaces its mechanism. Supersedes the `useKeyboardInset`/`--kb`
approach entirely.

## Context

Spec 07-14 decided the right behaviour: **the keyboard lifts only bottom sheets; no full-page
surface shrinks or floats.** The mechanism that implemented it — `interactive-widget=resizes-visual`
plus a hand-rolled `--kb` CSS variable driven by `visualViewport` events — shipped real bugs,
observed on device: the page flickers (the JS-driven lift races iOS's own caret-reveal pan, so the
sheet moves twice), and any sheet built outside the mechanism never lifts at all, because the lift
was opt-in per sheet by construction.

Separately, `main` shipped `maximum-scale=1, user-scalable=no`, which suppressed iOS's auto-zoom on
sub-16px input focus but blocks pinch-zoom on Android — a WCAG 1.4.4 failure and an axe/Lighthouse
flag in browser tabs.

Base UI's `Drawer` (the shadcn `base` variant primitive the rebuild adopts) ships
`<Drawer.VirtualKeyboardProvider>`: keyboard-aware focus and scroll handling for software keyboards,
verified against Base UI v1.6.0 docs. It is opt-in **per drawer** — a drawer without the provider
gets nothing.

## Decision

1. **The viewport stays `interactive-widget=resizes-visual`.** Full pages hold still; the keyboard
   overlays their lower edge. Spec 07-14's behavioural rule is unchanged.
2. **Keyboard lifting is owned by the primitive, not by app code.** The single shared `Drawer`
   component (our wrapper over the Base UI primitive of the same name — the shared name is
   deliberate, see UBIQUITOUS_LANGUAGE) bakes `Drawer.VirtualKeyboardProvider` into its anatomy, so
   every drawer is keyboard-aware by construction.
3. **Hand-made drawers are banned.** Every bottom overlay in the app goes through the one shared
   `Drawer`. This is what deletes the "my sheet doesn't lift" bug class permanently — there is no
   way to build a drawer that misses the keyboard handling.
4. **Transform-based keyboard lifting is banned.** JS must never translate content in response to
   the keyboard — that is the mechanism that raced iOS's caret-reveal pan and flickered. (The
   _measurement_ returns with a passive consumer — see the amendment below.)
5. **Inputs render at ≥16px** (`--ms-text-title`), baked into the shared `Input`/`Textarea`
   components — this kills iOS focus auto-zoom at the root, everywhere.
6. **Pinch-zoom is locked only in the installed app.** A snippet at boot appends `maximum-scale=1`
   to the viewport meta when `(display-mode: standalone)` matches. The browser tab stays zoomable
   (WCAG 1.4.4 holds where it applies); the installed app gets the locked, app-like viewport —
   deliberate, because the UI is gesture-heavy (card swipes, row swipes, drag) and accidental pinch
   mid-gesture reads as breakage.
7. **Snap points are first-class drawer anatomy.** The shared `Drawer` exposes Base UI `snapPoints`;
   tall surfaces (content taller than ~60dvh: content editor, in-study editor, card filter) ship a
   half ↔ full detent pair. Short drawers (action drawers, confirms, single-input prompts) stay at
   content height — a half detent on a three-item list would clip it.

## Amendment (2026-07-17, same session): full-page keyboard reachability

The contract above left a hole: a **non-scrollable full page with centered controls** (the login
form) under `resizes-visual` leaves any control beneath the keyboard unreachable — the browser
auto-reveals only the _focused_ field, and a page with no overflow has nothing to scroll. Verified
before deciding: **WebKit has never shipped `interactive-widget`** (bug 259770 open; standards
position undecided as of 2026), so on iOS the meta value is inert and the browser-native
`resizes-content` fix works only on Android. A cross-platform fix must be app code.

**Decision — scroll capacity, not lifting, app-wide:**

- A single shell **`KeyboardInsetProvider`** measures the keyboard overlap from `visualViewport`
  (rAF-throttled) and publishes one root CSS variable, `--kb-inset`.
- The shared page scaffold (`AppScreen`'s scroll region) consumes it as
  `padding-bottom: var(--kb-inset)` plus `scroll-padding-bottom` — every page gains **exactly**
  keyboard-height of scroll room while the keyboard is open, so the user can scroll any control
  into view and the browser's caret-reveal scrolls the inner container instead of panning the
  visual viewport. Nothing translates; chrome holds still. Because it lives in the one scaffold,
  the guarantee is app-wide by construction.
- **Layout rules ride along:** form pages top-align their content within the column where the
  design allows (fields start in the upper half); when a centered look is wanted, centering must be
  **overflow-safe** (`margin-block: auto` spacers, never bare `justify-content: center` — a
  centered flex container that overflows clips its top and becomes unscrollable, which is exactly
  the login layout).
- `main`'s `useKeyboardInset` changes status from _confirmed deletion_ to **reviewed starting point
  for the provider** — same measurement, new (passive) consumer. The ban in Decision 4 stands:
  the inset feeds padding on a scroll container, never a transform.

## Fallback

If P1's on-device verification still shows keyboard jank with the primitive-owned lift, the tested
fallback is flipping the meta tag to `interactive-widget=resizes-content` (the browser resizes the
layout viewport; bottom-anchored UI rides up automatically). One-line change, recorded here so it is
a decision, not a rediscovery.

## Consequences

- `use-drag-to-dismiss.ts` stays a confirmed deletion. `useKeyboardInset` is **not** — the
  amendment above repurposes its measurement for the page-level scroll-capacity inset.
- `MOBILE_DESIGN.md` §2 previously described `resizes-content`; it was stale (main shipped
  `resizes-visual`) and has been corrected to match this ADR.
- Every snapped drawer's half state is a real UI state and is verified like any other.
