/**
 * Whether motion is damped right now, read off `data-reduced-motion` — the attribute the inline
 * script in `index.html` sets before first paint and `PreferencesProvider` keeps. Reading the
 * document rather than the media query is what lets the learner's own switch count: the OS knows
 * nothing about it.
 */
export function readReducedMotion(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.dataset.reducedMotion === 'reduce'
}
