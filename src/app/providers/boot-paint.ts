/**
 * What `index.html` knows by hand. Its script runs before a line of this code and before the
 * stylesheet lands, so it carries these by itself — `boot-paint.test.ts` runs it against them.
 *
 * The status bar's colour is not here: the build writes it into `index.html` from `STATUS_BAR`
 * (`shared/config/status-bar.ts`), and the script reads it from there.
 */

/**
 * The learner's `Theme` — `light`, `dark` or `system` — mirrored so the first paint can be the one
 * they chose rather than the one the OS happens to be in.
 */
export const THEME_MIRROR_KEY = 'mindscape:theme'

/** Whether the learner asked for damped motion: `on` or `off`, mirrored for the same reason. */
export const MOTION_MIRROR_KEY = 'mindscape:reduced-motion'
