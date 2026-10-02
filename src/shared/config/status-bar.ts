/**
 * The status bar's colour per scheme, which is the colour of the app's own chrome. The installed app
 * runs under a `black` bar that iOS paints from `theme-color`, and Android tints its bar from the
 * same meta (ADR 0007), so this is what both platforms are told: the build writes one meta per OS
 * scheme from it (`vite.config.ts`), and `ThemeProvider` repaints them for the theme on screen.
 *
 * `status-bar.test.ts` holds it to `--status-bar` in `tokens.css`, which paints the header, so the
 * bar and the header are one block. Hex, because `index.html` is parsed before any stylesheet.
 */
export const STATUS_BAR = { light: '#2850b0', dark: '#0b1533' } as const
