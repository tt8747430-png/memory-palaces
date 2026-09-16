import { keyboardOpen, layoutBottom, subscribeKeyboardHeight } from './keyboard-viewport'

export interface ChromeBox {
  top: number
  width: number
  height: number
}

export function clearanceOf(box: ChromeBox, bottom: number): number {
  if (box.width === 0 && box.height === 0) return 0
  return Math.max(0, Math.round(bottom - box.top))
}

const claims = new Set<Element>()

let observer: ResizeObserver | null = null
let unwatchKeyboard: (() => void) | null = null
let published = -1

function reach(): number {
  if (keyboardOpen()) return 0
  const bottom = layoutBottom()
  let tallest = 0
  for (const node of claims) {
    tallest = Math.max(tallest, clearanceOf(node.getBoundingClientRect(), bottom))
  }
  return tallest
}

function publish() {
  const next = reach()
  if (next === published) return
  published = next
  document.documentElement.style.setProperty('--bottom-chrome', `${next}px`)
}

function start() {
  if (observer) return
  observer = new ResizeObserver(publish)
  observer.observe(document.documentElement)
  unwatchKeyboard = subscribeKeyboardHeight(publish)
}

function stop() {
  observer?.disconnect()
  observer = null
  unwatchKeyboard?.()
  unwatchKeyboard = null
  published = -1
  document.documentElement.style.removeProperty('--bottom-chrome')
}

export function claimBottomChrome(node: Element): () => void {
  start()
  claims.add(node)
  observer?.observe(node)
  publish()

  return () => {
    if (!claims.delete(node)) return
    observer?.unobserve(node)
    if (claims.size === 0) stop()
    else publish()
  }
}
