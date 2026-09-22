import { createContext, use } from 'react'

export const SCREEN_SCROLL = 'overflow-y-auto overscroll-contain scrollbar-hide'

/**
 * The element a screen scrolls — `AppScreen`'s `<main>` — for the few things that must read its
 * geometry, like a list that draws only the rows in view. State rather than a ref: a child's layout
 * effects run before an ancestor's ref is attached, so a ref would still be empty on the list's
 * first pass, and nothing would tell it the element had arrived.
 */
export const ScreenScrollContext = createContext<HTMLElement | null>(null)

export function useScreenScroll(): HTMLElement | null {
  return use(ScreenScrollContext)
}
