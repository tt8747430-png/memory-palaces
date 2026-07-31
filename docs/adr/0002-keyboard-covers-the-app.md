# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07-27 · **Last revised:** 2026-07-31
- **Supersedes:** the shrink-to-fit design (`#root` sized to `--vvh`, re-anchored to `--vv-top`)

This is the decision and why. The operational rules are [CODE_STYLE §11](../CODE_STYLE.md); the implementation is
`shared/lib/keyboard-viewport.ts`, which carries the same reasoning per branch.

## Context

`#root` used to be sized and positioned from the _visual_ viewport, so the shell fitted the keyboard exactly and a
`FooterBar` always came to rest on the keyboard's edge. Three faults followed, all from one source: the app moved
content in response to a viewport it did not control.

What iOS actually does — measured on device, not inferred, because two rounds of fixes were lost to guessing:

- **The layout viewport does not resize; only the visual viewport shrinks.** Shell `793` before and during the keyboard,
  `visualViewport.height` `390`, `offsetTop` `289` (iOS 26, standalone).
- **Safari _pans_ the visual viewport to reveal the focused field, and holds the pan until blur** — but **only when the
  page has not revealed the field itself.** That clause is the whole design.
- **`visualViewport.offsetTop` and `getBoundingClientRect()` are different coordinate spaces.** Mixing them
  double-counts the pan silently. Two fixes died here.
- **`interactive-widget` is unimplemented in WebKit as of iOS 26**
  ([WebKit #259770](https://bugs.webkit.org/show_bug.cgi?id=259770)) — the meta in `index.html` is inert on iOS, so this
  is handled in JS or not at all. It is still declared `resizes-visual` **on purpose**: Chrome 108+ and Firefox 132+ do
  honour it, and under `resizes-content` the layout viewport shrinks with the visual one, collapsing the measurement to
  ~0 — no inset, no scroll range, no reveal. Do not "modernise" it.
- **Pinch-zoom is indistinguishable from a keyboard by geometry** — height shrinks and `offsetTop` pans for both;
  `scale` is the only tell, and WebKit ignores `user-scalable=no`.

## Decision

**The app is anchored to the screen, not to the viewport. The keyboard covers its bottom. The scroll body — not the
shell, and not iOS — reveals the focused field.**

- **`--app-height` is the layout viewport sampled while nothing is focused, and held there.** `#root` is
  `position: fixed; top: 0; height: var(--app-height)`, re-anchored only on a width change or growth. Every keyboard
  number derives from it, never from live `clientHeight`.
- **Nothing compensates for the pan. The pan is prevented.** Four successive fixes tried to survive it — a
  `display-mode` gate, a measured boolean, a hidden probe, with `--vv-top`/`--pan-comp`/`--pan-pad`/`.pt-pan` hanging
  off them — and each traded one symptom for another, because compensation and WebKit's own reveal are two controllers
  fighting over the same geometry. All of it is deleted. **The provocation was scroll range:** padding of exactly
  `--kb-inset` lets a scroll body lift its last field only _up to_ the keyboard's edge, so iOS finished the job. The
  range is now `--kb-range` = `--kb-inset + REVEAL_GAP`, published by the same module that aims the reveal so the two
  cannot drift.
- **"Is a keyboard up" and "how much does it cover" are two numbers.** The keyboard's own height is
  `--app-height − visualViewport.height`; `--kb-inset` is that minus the pan. The 120px floor separates a keyboard from
  an accessory bar, so it belongs on the **height** — on the inset it is a category error that reads a heavily panned
  keyboard as no keyboard at all.
- **`visibleBottom()` is the only bridge between the two coordinate spaces**, and survives because it is not
  compensation. Everything else is rect-vs-rect.
- **`resize` only; `scroll` is not subscribed to at all.** There is no correct sampling rate for a number nothing
  should be positioned from.
- **Bottom-anchored chrome yields to the keyboard rather than floating above it.** WebKit re-clamps bottom-anchored
  fixed/sticky boxes to the visual viewport, so the footer dock goes `static` and `AppNav` hides outright.

## Consequences

- **The acceptance test is that the header does not move at all when the keyboard opens.** If it moves again, the
  question is never "what should compensate" but "why did the reveal not clear the field".
- **A footer is not reachable without scrolling while typing** — the CTA rests at the end of the page, behind the
  keyboard. MOBILE_DESIGN §2/§6 follow this; do not "restore" the older rule that it stay above the keyboard. Put an
  action that must survive typing in the header instead.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own fields, so `useKeyboardReveal`
  is opt-in per scroll node, never a global `focusin` listener.
- **`/dev/kitchen-sink` carries a live viewport probe, and it ships in production builds on purpose.** None of this
  reproduces outside the installed PWA, which needs HTTPS, which rules out a dev server — a `import.meta.env.DEV` gate
  put the one diagnostic that mattered out of reach of the only environment that shows the bug. It judges the reading
  rather than printing it, and keeps keyboards as `{ before, after }` pairs because every number here is a difference.
  **This trade expires at 1.0** — see `NEW_ARCHITECHTURE.md` T11.G.
- **`--app-height` can go stale against a genuinely smaller layout viewport**, since it only shrinks on a width change.
  Accepted: the PWA runs standalone, where that does not happen, and the alternative is trusting a number the keyboard
  is allowed to move.
