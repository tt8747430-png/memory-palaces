import { useCallback, useRef } from 'react'
import {
  expectKeyboard,
  REVEAL_GAP,
  subscribeKeyboardHeight,
  visibleBottom,
} from './keyboard-viewport'

const NON_TEXT_INPUT = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

export interface RevealBand {
  top: number
  bottom: number
}

export function revealOffset(view: RevealBand, field: RevealBand, gap = REVEAL_GAP): number {
  if (field.top < view.top + gap) return field.top - gap - view.top
  if (field.bottom > view.bottom - gap) {
    return Math.min(field.bottom + gap - view.bottom, field.top - gap - view.top)
  }
  return 0
}

/**
 * Marks the scroll node the reveal is attached to. The probe reads it rather than guessing at
 * `main`: "the field never moved" and "the field moved a node nobody watches" are the same still
 * reading, and only this attribute tells them apart.
 */
export const REVEAL_SCROLL_ATTR = 'data-reveal-scroll'

export function isTextField(node: EventTarget | null): node is HTMLElement {
  if (node instanceof HTMLTextAreaElement) return true
  if (node instanceof HTMLInputElement) return !NON_TEXT_INPUT.has(node.type)
  return node instanceof HTMLElement && node.isContentEditable
}

export function useKeyboardReveal(): (node: HTMLElement | null) => void {
  const detach = useRef<(() => void) | null>(null)

  return useCallback((node: HTMLElement | null) => {
    detach.current?.()
    detach.current = null
    if (!node) return

    /**
     * Lands the field between the chrome, clear of the keyboard by `REVEAL_GAP`. Doing it well is
     * what keeps iOS from panning to do it instead: the pan is not a fact of the platform, it is
     * what the platform does when the page has not revealed its own field.
     */
    const reveal = (field: HTMLElement) => {
      const bounds = node.getBoundingClientRect()
      const chrome = node.parentElement?.querySelector('[data-slot="header-bar"]')
      const dock = node.querySelector('[data-slot="footer-bar"]')
      const band = {
        top: Math.max(bounds.top, chrome?.getBoundingClientRect().bottom ?? 0),
        bottom: Math.min(
          bounds.bottom,
          visibleBottom(),
          dock?.getBoundingClientRect().top ?? Infinity,
        ),
      }
      const delta = revealOffset(band, field.getBoundingClientRect())
      if (delta !== 0) node.scrollTop += delta
    }

    let syncing = false

    const onFocusIn = (event: FocusEvent) => {
      if (!isTextField(event.target)) return
      syncing = true
      expectKeyboard(true)
      syncing = false
      reveal(event.target)
    }

    const onFocusOut = (event: FocusEvent) => {
      if (isTextField(event.relatedTarget)) return
      expectKeyboard(false)
    }

    const unsubscribe = subscribeKeyboardHeight(() => {
      if (syncing) return
      const active = document.activeElement
      if (isTextField(active) && node.contains(active)) reveal(active)
    })

    node.addEventListener('focusin', onFocusIn)
    node.addEventListener('focusout', onFocusOut)
    node.setAttribute(REVEAL_SCROLL_ATTR, '')

    detach.current = () => {
      node.removeEventListener('focusin', onFocusIn)
      node.removeEventListener('focusout', onFocusOut)
      node.removeAttribute(REVEAL_SCROLL_ATTR)
      unsubscribe()
      expectKeyboard(false)
    }
  }, [])
}
