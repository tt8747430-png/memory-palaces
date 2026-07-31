import type { MouseEvent } from 'react'

export const TEXT_ENTRY = 'input, textarea, [contenteditable="true"], .allow-select'

/**
 * Stops a control stealing focus from an open field. iOS blurs on `mousedown`, dropping the
 * keyboard, moving everything anchored to it out from under the finger, leaving the `click` on
 * nothing. Preventing the default keeps the caret; the control still fires, and keyboard nav is
 * untouched because it never produces a `mousedown`.
 *
 * A tap landing in another field is left alone — that one is meant to move focus.
 *
 * `HeaderBar`, `FooterBar`, `DrawerHeader` and `DrawerFooter` install it themselves; a page action
 * inherits the guard and must not re-add it.
 */
export function keepFieldFocused(event: MouseEvent<HTMLElement>) {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return
  if (event.target instanceof Element && event.target.closest(TEXT_ENTRY)) return
  event.preventDefault()
}
