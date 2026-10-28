# ADR 0007 — iOS paints the status bar, and the bar and the header are one block

- **Status:** accepted · **Date:** 2026-10 · consolidated 2026-10

The operational rules are [CODE_STYLE §8](../CODE_STYLE.md#s8) and [§5](../CODE_STYLE.md#s5). The
implementation is `index.html`, `vite.config.ts`, `shared/config/status-bar.ts`, `shared/lib/theme-color.ts` and
`app/providers/use-device-theme.ts`, mounted by `PreferencesProvider`.

## Context

- Under `apple-mobile-web-app-status-bar-style: black-translucent` WebKit sizes an installed app's web view as if the
  bar were opaque and draws it under the bar. Measured on device (iOS 26 standalone, 393×852 screen, 59pt bar): the
  layout viewport is `793` at the top of the screen, so the bottom 59px belong to no web content and the app reads as
  lifted. No CSS reaches pixels outside the web view. The same defect was logged on device in 2026-07.
- The reports of a bar in the wrong colour had two causes, both in the app. `index.html` held one bare meta with the
  light colour, and the theme was painted from the preferences store's default before the store had loaded, so
  whenever the learner's theme differed from the OS, iOS was handed the wrong colour at launch.
- A pale translucent header under a flat navy bar met it at a hard seam on every screen.

## Decision

**`black`: iOS paints the bar from `theme-color`, the web view starts below it, and the header is painted the same
colour.**

- One constant, `STATUS_BAR` (`shared/config/status-bar.ts`), is the bar's colour per scheme. `status-bar.test.ts`
  holds `--status-bar` in `tokens.css` equal to it.
- **The header is the bar's colour.** `.chrome` (`theme.css`) paints `--chrome-surface`, which is `--status-bar`,
  and redeclares every semantic colour role at its on-chrome value, so anything inside that names a role reads right
  on the dark block with no variant of its own. `AppHeader` and `ResultScreen` wear it. `StudySessionHeader` paints
  nothing: the card style's scene runs under it, below a bar that stays the chrome colour.
  `tokens.test.ts` refuses a `.chrome` value that is not a token or a tint mixed from one.
- The build writes one `theme-color` meta per OS scheme (`vite.config.ts`), so the HTML iOS parses is right for the OS
  theme before any script runs. The boot script in `index.html` copies the chosen theme's meta onto every
  `theme-color` meta before first paint; it holds no colour literals. The manifest's `theme_color` and
  `background_color` are `STATUS_BAR.light`.
- **Nothing reaches the device until preferences are ready.** `PreferencesProvider` mounts `useDeviceTheme` and
  `useDeviceMotion` only then, so no default is ever painted or mirrored. After that every meta is written from
  `STATUS_BAR` on each change (`paintStatusBar`), which is what Android follows too.
- The top inset is `env(safe-area-inset-top)` (`--safe-top`), `0` in an installed app under `black`. Nothing holds,
  remembers or compensates for it, and nothing is drawn under the clock.

Rejected: keeping `black-translucent` and correcting the height, since the missing strip is outside the web view;
and a translucent header, since a moving material can never equal a flat bar.

## Consequences

- The bar stays the chrome colour above every screen: the study scene, the splash and a sheet's backdrop no longer
  run under it or dim it. That is the price of a web view that reaches the bottom of the screen.
- A theme switched while the app is open is written to every meta at once. If an iOS release paints the bar only
  from the value read at load, the bar catches up at the next launch.
- `/dev/kitchen-sink`'s probe checks it: **status bar** fails an installed app on any style but `black` or with a
  non-zero top inset, and prints `screen h` beside `layout viewport h`; **theme-color** passes when every meta carries
  the painted theme's colour.
- **Verify on a device** whenever a change touches the top edge or the theme: launch in either theme with the app's
  theme the same as and opposite to the OS's, a switch while open, a study session, the bottom edge.

## History

- `black`, with a page that tried to paint the bar at runtime (2026-09). iOS kept the colour it read at load.
- 0006 — `black-translucent`: the page painted under the clock, with an anchored top inset (`top-inset.ts`,
  `--safe-top-held`, a remembered value applied by the boot script) and a `StatusBarScrim` behind the white clock on
  light surfaces (2026-09). Replaced by this record: it brought back the short web view.
- A translucent glass header under a navy bar (2026-09). Replaced by `.chrome`.
