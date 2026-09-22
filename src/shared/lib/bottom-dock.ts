/** The height of the one bottom slot: the app nav and the select toolbar are both exactly this. */
const BOTTOM_INSET = 'calc(var(--p-safe-bottom) + 4rem)'

/** Holds the slot's height open for as long as the dock is on screen. */
export function claimBottomInset(): () => void {
  document.documentElement.style.setProperty('--app-bottom-inset', BOTTOM_INSET)
  return () => document.documentElement.style.removeProperty('--app-bottom-inset')
}
