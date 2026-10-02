/**
 * The status bar's colour per scheme, which is the colour of the app's own chrome. The installed app
 * runs under a `black` bar that iOS paints from `theme-color`, and Android tints its bar from the
 * same meta (ADR 0007), so this is what both platforms are told: the build writes `THEME_COLOR_METAS`
 * into `index.html`, and `useDeviceTheme` repaints them for the theme on screen.
 *
 * `status-bar.test.ts` holds it to `--status-bar` in `tokens.css`, which paints the header, so the
 * bar and the header are one block. Hex, because `index.html` is parsed before any stylesheet.
 */
export const STATUS_BAR = { light: '#2850b0', dark: '#0b1533' } as const

/**
 * The `theme-color` metas the build writes ahead of `index.html`'s boot script, one per OS scheme,
 * so the HTML iOS parses is right for the OS's theme before any script has run. The boot script
 * finds the chosen theme's meta by this `media`.
 */
export const THEME_COLOR_METAS = [
  { name: 'theme-color', media: '(prefers-color-scheme: light)', content: STATUS_BAR.light },
  { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: STATUS_BAR.dark },
] as const
