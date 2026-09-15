import type { MouseEvent } from 'react'

export const TEXT_ENTRY = 'input, textarea, [contenteditable="true"], .allow-select'

export function keepFieldFocused(event: MouseEvent<HTMLElement>) {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return
  if (event.target instanceof Element && event.target.closest(TEXT_ENTRY)) return
  event.preventDefault()
}
