const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

export const REVEAL_GAP = 24

let hidden = 0
let present = false
let expected = 0
let expecting = false
let reserving = false
let published = -1
let publishedOpen = false

let appHeight = 0
let appWidth = 0

const listeners = new Set<() => void>()

function readStored(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const value = raw ? Number(raw) : 0
    return Number.isFinite(value) && value >= KEYBOARD_MIN ? Math.round(value) : 0
  } catch {
    return 0
  }
}

function writeStored(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {}
}

function publish(): boolean {
  const open = present || (reserving && expected > 0)
  const next = present ? hidden : open ? expected : 0
  if (next === published && open === publishedOpen) return false
  published = next
  publishedOpen = open
  const style = document.documentElement.style
  style.setProperty('--kb-inset', `${next}px`)
  style.setProperty('--kb-range', open ? `${next + REVEAL_GAP}px` : '0px')
  document.documentElement.toggleAttribute('data-keyboard', open)
  return true
}

function notify() {
  listeners.forEach((listener) => listener())
}

function publishHeight(next: number) {
  if (next === appHeight) return
  appHeight = next
  document.documentElement.style.setProperty('--app-height', `${next}px`)
}

function viewportHeight(): number {
  return appHeight || document.documentElement.clientHeight
}

export function keyboardHeight(): number {
  return Math.max(0, published)
}

export function keyboardOpen(): boolean {
  return publishedOpen
}

export function keyboardIsMeasured(): boolean {
  return present
}

export function visibleBottom(): number {
  const originTop = document.documentElement.getBoundingClientRect().top
  return originTop + viewportHeight() - keyboardHeight()
}

export function subscribeKeyboardHeight(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function expectKeyboard(on: boolean) {
  if (expecting === on) return
  expecting = on
  reserving = on && !present
  if (publish()) notify()
}

export function startKeyboardViewport(): () => void {
  const root = document.documentElement
  const vv = window.visualViewport
  expected = readStored()

  const reset = () => {
    hidden = 0
    present = false
    expecting = false
    reserving = false
    published = -1
    publishedOpen = false
    appHeight = 0
    appWidth = 0
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--kb-range')
    root.style.removeProperty('--app-height')
    root.removeAttribute('data-keyboard')
  }

  const anchor = () => {
    const width = root.clientWidth
    if (width !== appWidth) {
      appWidth = width
      publishHeight(root.clientHeight)
      return
    }
    if (!expecting && root.clientHeight > appHeight) publishHeight(root.clientHeight)
  }

  if (!vv) {
    anchor()
    publish()
    return reset
  }

  let frame = 0

  const measure = () => {
    frame = 0

    anchor()

    if (vv.scale !== 1) return

    const keyboard = Math.max(0, Math.round(appHeight - vv.height))
    present = keyboard >= KEYBOARD_MIN

    hidden = present ? Math.max(0, keyboard - Math.max(0, Math.round(vv.offsetTop))) : 0

    if (present) {
      reserving = false
      if (keyboard > expected) {
        expected = keyboard
        writeStored(keyboard)
      }
    }

    publish()

    notify()
  }

  const onResize = () => {
    if (!frame) frame = window.requestAnimationFrame(measure)
  }

  measure()
  vv.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)

  return () => {
    window.cancelAnimationFrame(frame)
    vv.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    reset()
  }
}
