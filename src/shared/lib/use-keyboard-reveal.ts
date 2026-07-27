import { useCallback, useRef } from 'react'
import { expectKeyboard, keyboardHeight, subscribeKeyboard } from './keyboard-viewport'

const REVEAL_GAP = 16

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

function isTextField(node: EventTarget | null): node is HTMLElement {
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

    const reveal = (field: HTMLElement) => {
      const bounds = node.getBoundingClientRect()
      const rect = field.getBoundingClientRect()
      const limit = document.documentElement.clientHeight - keyboardHeight()
      const delta = revealOffset(
        { top: bounds.top, bottom: Math.min(bounds.bottom, limit) },
        { top: rect.top, bottom: rect.bottom },
      )
      if (delta !== 0) node.scrollTop += delta
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!isTextField(event.target)) return
      expectKeyboard(true)
      reveal(event.target)
    }

    const onFocusOut = (event: FocusEvent) => {
      if (isTextField(event.relatedTarget)) return
      expectKeyboard(false)
    }

    const unsubscribe = subscribeKeyboard(() => {
      const active = document.activeElement
      if (isTextField(active) && node.contains(active)) reveal(active)
    })

    node.addEventListener('focusin', onFocusIn)
    node.addEventListener('focusout', onFocusOut)

    detach.current = () => {
      node.removeEventListener('focusin', onFocusIn)
      node.removeEventListener('focusout', onFocusOut)
      unsubscribe()
      expectKeyboard(false)
    }
  }, [])
}
