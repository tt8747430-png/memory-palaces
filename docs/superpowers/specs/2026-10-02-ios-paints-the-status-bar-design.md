# iOS paints the status bar

_2026-10-02_ · decision record: [ADR 0007](../../adr/0007-ios-paints-the-status-bar.md)

## Reports

1. The status bar does not meet the header as one block.
2. A strip at the bottom of the installed app; the whole app sits lifted above it.

Reference that works on the same device: `School/piano-trainer` (`black`, media-matched `theme-color` pair from
one constant, boot script repaints it for the chosen theme).

## Causes (confirmed)

| Report | Cause | Evidence |
| --- | --- | --- |
| Bottom strip, app lifted | `black-translucent` (`c21f3637`): WebKit sizes the installed web view as if the bar were opaque and draws it under the bar | Probe: layout viewport `793` on an 852pt screen with a 59pt bar; same defect logged on device 2026-07-18 (`2de70e67`, `b96dc9f6`) |
| Bar ≠ header | The lifted web view cuts into the header's `--safe-top` band | Same probe; one cause with the strip |
| Bar wrong in dark (the reason ADR 0006 left `black`) | One bare meta with the light literal, and `ThemeProvider` painting the store's `'system'` default before preferences load, so iOS was handed the OS scheme on every launch where app ≠ OS | `selectEffectivePreferences` returns `DEFAULT_PREFERENCES` until `ready`; `adoptDeviceSettings` doesn't wait for the store |

## Design

**Style.** `apple-mobile-web-app-status-bar-style: black`. iOS paints the bar from `theme-color`; the web view runs
from below it to the bottom edge.

**One colour constant.** `shared/config/status-bar.ts` exports `STATUS_BAR = { light: '#2850b0', dark: '#0b1533' }`,
the chrome colour. `status-bar.test.ts` holds `--status-bar` in `tokens.css` equal to it.

**Build.** A `vite.config.ts` plugin writes `<meta name="theme-color" media="(prefers-color-scheme: X)">` for both
schemes at `head-prepend` (dev and build).

**Boot.** `index.html`'s `#boot-paint` script resolves the theme from the mirror (or the OS), sets `data-theme`, and
copies the content of the meta whose media names that theme onto every `theme-color` meta. It holds no colour
literals and no inset memory.

**Runtime.** `ThemeProvider` takes `theme: Theme | undefined`. `PreferencesProvider` passes `undefined` until the
preferences store is ready, and `ThemeProvider` does nothing then: no paint, no mirror write. Once ready it sets
`data-theme`, writes every meta via `paintStatusBar(scheme)` (`shared/lib/status-bar.ts`), mirrors the choice, and
follows the OS while on `system`.

**Top inset.** `--safe-top: env(safe-area-inset-top)`; `.pt-safe` pads by it. Deleted: `top-inset.ts` (+ test,
`startTopInset` in `main.tsx`, exports), `--safe-top-held`, the boot script's inset memory.

**Nothing under the clock.** Deleted: `StatusBarScrim` (+ export), `--status-scrim` (+ its `tokens.test.ts` entry),
`CardScene`'s `underStatusBar` (+ `FlashcardsPanel`, `StyleFullscreen` callers), `sceneTone`, the scrim in
`AuthScreen`, `QuizPanel`, `MatchBoard`.

**Probe.** `status-bar.ts` keeps only `paintStatusBar` and `readThemeColors`. The probe sample drops
`safeTopHeld`/`statusBarPainted` and adds `envTop` (measured through a box `env(safe-area-inset-top)` tall) and
`screenHeight`. Checks: **status bar** — installed must be `black` with `env top` 0 (`black-translucent` names the
short web view); a tab is idle. **theme-color** — every meta carries `STATUS_BAR` of the painted scheme.

**Docs.** ADR 0007 (0006 marked superseded), MOBILE_DESIGN §12, CODE_STYLE §4a/§11, CLAUDE.md "Read before you
touch".

## Testing

- `shared/config/status-bar.test.ts`: constant = tokens.
- `boot-paint.test.ts`: runs the boot script (`new Function`) — chosen theme over OS, `system` asks the OS, every
  meta repainted, corrupt storage falls back, style meta is `black`, motion attribute set.
- `ThemeProvider.test.tsx`: no paint/mirror while `theme` is `undefined`; every meta repainted on change; OS follow.
- `status-bar.test.ts`, `viewport-sample.test.ts`, `CardScene.test.tsx`, `tokens.test.ts` updated.
- `npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph`; `dist/index.html`
  carries both metas.
- Device: launch in each theme (app = OS and app ≠ OS), switch while open, study session, bottom edge, keyboard
  open/dismiss.
