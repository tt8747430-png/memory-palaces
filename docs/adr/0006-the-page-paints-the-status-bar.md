# ADR 0006 — The page paints the status bar

- **Status:** accepted · **Date:** 2026-09-23
- **Supersedes:** `black` status-bar style (2026-09-06, `fix(pwa): paint the status bar black, not translucent`)

The operational rules are [MOBILE_DESIGN §12](../MOBILE_DESIGN.md) and [CODE_STYLE §4a](../CODE_STYLE.md); the
implementation is `index.html`, `shared/lib/top-inset.ts` and `shared/ui/StatusBarScrim.tsx`.

## Context

Under `apple-mobile-web-app-status-bar-style: black` the web view starts below the status bar and iOS paints the bar
itself. What it paints it with was assumed, then designed around, and was wrong:

- **iOS paints the bar from the `theme-color` it read at load, and never again.** `ThemeProvider` rewrote the meta
  on every theme change; the bar did not move. Measured on device (2026-09-23, iOS 26 standalone): in dark mode, with
  the meta rewritten to `#0b1533`, the bar stayed `#2850b0` — the literal in `index.html`.
- So nothing the app did at runtime reached the bar, and four reports followed from that one fact: the bar stayed blue
  over a study session's scene, over the splash, under a sheet's backdrop (which dimmed everything but the bar), and in
  dark mode.
- `black` had been chosen because under `black-translucent` iOS reported `env(safe-area-inset-top)` late and
  inconsistently — `0` on the first paint, and again for a moment across a keyboard dismiss — and the header, padded
  by the live value, slid under the clock and back.

## Decision

**`black-translucent`: the web view runs under the clock, and whatever the page paints there is the status bar.**

- Every report is then true by construction. The header's `.chrome` runs up under the clock (`pt-safe`), so the bar and
  the header are one block in either theme. The splash, every backdrop and the finished-session screen are
  `fixed inset-0`, so they cover the bar. A study session's scene fills the screen from its top edge, and its header
  paints nothing.
- **The top inset is anchored, not trusted.** `top-inset.ts` reads `env(safe-area-inset-top)` through a box that is
  exactly that tall, holds it per shape (installed or in a tab, at this width) — raised by a larger reading, never
  lowered by a smaller one — and publishes `--safe-top-held`. It remembers the value, and the boot script in
  `index.html` applies it before the first paint. `--safe-top` is the larger of the held and the live value; every
  top is padded by it, never by raw `env()`. This answers the late first report and the dropped one without any
  compensation of the kind ADR 0002 deleted: nothing moves in response to the pan or the keyboard.
- **The clock is always white.** iOS will not draw it dark under a translucent bar. A light surface under it — a light
  card scene, the auth screen and the quiz and match boards by day — draws `StatusBarScrim`, a `--status-scrim`
  gradient as tall as the bar that fades below it. It is zero-height where there is no bar.
- **`theme-color` stays, and is Android's.** Android follows it as it changes; `ThemeProvider` writes `--status-bar`,
  the token the chrome is painted with.

Rejected: a media-matched pair of `theme-color` metas. iOS would pick one at load by the OS appearance — right only
when the OS and the learner's theme agree, and still blind to the scene, the splash and every backdrop.

## Consequences

- **A screen owns its top.** A screen with no header paints what the clock sits on; one whose top is light draws the
  scrim. `/dev/kitchen-sink`'s probe reports `status style`, `--safe-top held` and `env top`, and its **top inset**
  check fails an installed app on any other style, or when the held inset is short of what iOS reports.
- **Verify on a device** whenever a change touches the top edge: launch (first frame), keyboard open and dismiss, a
  sheet opening, a study session in a light and a dark card style, both themes.
- The remembered inset can be stale for a device whose status bar height changed between launches at the same width.
  Accepted: the live `env()` still wins when it is larger, and the next reading corrects the memory upward.
