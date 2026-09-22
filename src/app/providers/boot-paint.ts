/**
 * What `index.html` knows by hand. Its script runs before a line of this code and before the
 * stylesheet lands, so it carries these by itself — `boot-paint.test.ts` is the only thing keeping
 * its copies and the app's saying the same thing.
 *
 * The status bar's colour is not here: it is `--status-bar` in `tokens.css`, because the same value
 * paints the canvas behind the app. `ThemeProvider` reads the token and tells the platform.
 */

/**
 * The learner's `Theme` — `light`, `dark` or `system` — mirrored so the first paint can be the one
 * they chose rather than the one the OS happens to be in.
 */
export const THEME_MIRROR_KEY = 'mindscape:theme'

/** Whether the learner asked for damped motion: `on` or `off`, mirrored for the same reason. */
export const MOTION_MIRROR_KEY = 'mindscape:reduced-motion'
