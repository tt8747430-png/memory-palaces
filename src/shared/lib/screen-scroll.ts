/**
 * Every scroll surface in the app. `pt-pan` is the load-bearing part: where the platform does not
 * re-anchor the shell during a keyboard pan, top chrome is ridden back onto the screen and the
 * scrollport needs the same offset as range at its top, or the first `--pan-comp` of content sits
 * behind the chrome with no way to scroll it out. A surface that opts out of this string is a
 * surface that loses its top to the keyboard — see CODE_STYLE §11.
 */
export const SCREEN_SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide pt-pan'
