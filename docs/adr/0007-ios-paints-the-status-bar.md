# ADR 0007 — iOS paints the status bar

- **Status:** accepted · **Date:** 2026-10-02
- **Supersedes:** [ADR 0006](0006-the-page-paints-the-status-bar.md) (`black-translucent`, 2026-09-23)

The operational rules are [MOBILE_DESIGN §12](../MOBILE_DESIGN.md) and [CODE_STYLE §4a](../CODE_STYLE.md); the
implementation is `index.html`, `vite.config.ts`, `shared/config/status-bar.ts` and `app/providers/ThemeProvider.tsx`.

## Context

ADR 0006 moved the installed app to `apple-mobile-web-app-status-bar-style: black-translucent` so the page could paint
under the clock. It brought back a defect found on device on 2026-07-18 (`2de70e67`, `b96dc9f6`) and lost in the
rewrite that followed:

- **Under `black-translucent` WebKit sizes an installed app's web view as if the bar were opaque, and draws it under
  the bar.** Measured on device (2026-10-02, iOS 26 standalone, 393×852 screen with a 59pt bar): the layout viewport
  is `793` = 852 − 59, at the top of the screen. The bottom 59px belong to no web content, so a strip of the native
  window shows there and the whole app reads as lifted. No CSS reaches pixels outside the web view.
- The reports ADR 0006 answered were not the platform ignoring `theme-color`. Two causes, both ours:
  - `index.html` held one bare meta with the light colour as a literal. Only the boot script corrected it for dark.
  - `ThemeProvider` ran on the preferences store's default before the store had loaded. It repainted `data-theme`
    and `theme-color` with the OS scheme and wrote `'system'` over the mirrored choice. So whenever the learner's
    theme differed from the OS, every launch handed iOS the wrong colour while the page was loading.
- `School/piano-trainer` runs on the same device with `black` and a media-matched pair of `theme-color` metas built
  from one constant. Its bar follows both the OS theme and a theme chosen in the app.

## Decision

**`black`: iOS paints the status bar from `theme-color`, and the web view starts below it.**

- The bar's colour per scheme is one constant, `STATUS_BAR` (`shared/config/status-bar.ts`). It is the header's
  chrome colour; `status-bar.test.ts` holds `--status-bar` in `tokens.css` equal to it, so the bar and the header
  are one block by construction.
- The build writes one `theme-color` meta per OS scheme from it (`vite.config.ts`). The HTML iOS parses is right
  for the OS theme before any script runs. `index.html`'s boot script copies the chosen theme's meta onto every
  `theme-color` meta before first paint, so a theme picked in the app wins over the OS's from the first frame. The
  script carries no colour literals.
- `ThemeProvider` paints nothing until the preferences store is ready. Until then the boot script's paint stands, and
  no default is ever handed to the platform or written to the mirror. After that it writes every meta from
  `STATUS_BAR` on each change, which is what Android follows too.
- The top inset is `env(safe-area-inset-top)` (`--safe-top`). It is `0` in an installed app under `black`. Nothing
  holds it, remembers it or compensates for it. `top-inset.ts`, `--safe-top-held` and the boot script's inset memory
  are deleted.
- Nothing is drawn under the clock, so `StatusBarScrim`, `--status-scrim`, `CardScene`'s `underStatusBar` and
  `sceneTone` are deleted.

Rejected: keeping `black-translucent` and correcting the height. The missing strip is outside the web view, so
nothing the page lays out or paints can reach it.

## Consequences

- **The bar is the app's own chrome.** It stays the chrome colour above every screen. That includes a study
  session's scene, the splash and a sheet's backdrop, which no longer run under it or dim it. This is the price of a
  web view that reaches the bottom of the screen.
- A theme switched while the app is open is written to every meta at once. If an iOS release paints the bar only
  from the value it read at load, the bar catches up on the next launch. `/dev/kitchen-sink`'s probe tells the two
  apart: its **theme-color** check passes whenever the metas carry the painted theme's colour.
- `/dev/kitchen-sink`'s **status bar** check fails an installed app on any style but `black`, or when
  `env(safe-area-inset-top)` is non-zero there. It also prints `screen h` beside `layout viewport h`, so a web view
  sized short of the screen shows as a number instead of an inference.
- **Verify on a device** whenever a change touches the top edge or the theme: launch in either theme, with the app's
  theme the same as and opposite to the OS's, a switch while open, a study session, and the bottom edge.
