/** The height of the one bottom slot: the app nav and the select toolbar are both exactly this. */
const BOTTOM_INSET = 'calc(var(--p-safe-bottom) + 4rem)'

let claims = 0

/**
 * Holds the slot's height open for as long as anything occupies it.
 *
 * The count, rather than the last unmount, is what decides: while the nav and the select toolbar
 * cross-fade, both are mounted, and the one that leaves must not pull the inset out from under the
 * one that arrived. Without the count the scroll body beneath them jumps a frame in each direction.
 */
export function claimBottomInset(): () => void {
  claims += 1
  if (claims === 1) {
    document.documentElement.style.setProperty('--app-bottom-inset', BOTTOM_INSET)
  }
  let released = false
  return () => {
    if (released) return
    released = true
    claims -= 1
    if (claims === 0) document.documentElement.style.removeProperty('--app-bottom-inset')
  }
}
