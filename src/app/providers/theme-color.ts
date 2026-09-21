/**
 * The status bar behind the app's own header, one colour per scheme. It lives beside
 * `ThemeProvider` rather than in `index.html`'s media-matched metas, because the learner's theme
 * is not the OS's: on "dark" over a light OS, a media-matched meta paints the bar the wrong
 * colour. `index.html` sets the same two values before first paint so the bar never flashes.
 */
export const THEME_COLOR = { light: '#091A7A', dark: '#0B1533' } as const
