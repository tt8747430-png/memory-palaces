import type { MouseEvent } from 'react'

export const TEXT_ENTRY = 'input, textarea, [contenteditable="true"], .allow-select'

/**
 * Stops a control from stealing focus from an open field. iOS blurs on `mousedown`, which drops
 * the keyboard, moves everything anchored to it out from under the finger, and leaves the `click`
 * landing on nothing. Preventing the default keeps the caret — the control still fires, and
 * keyboard navigation is untouched because it never produces a `mousedown`.
 *
 * A tap that lands in another field is left alone: that one is meant to move focus.
 */
export function keepFieldFocused(event: MouseEvent<HTMLElement>) {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return
  if (event.target instanceof Element && event.target.closest(TEXT_ENTRY)) return
  event.preventDefault()
}
