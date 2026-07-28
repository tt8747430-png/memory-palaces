const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

let measured = 0
let expected = 0
let expecting = false
let published = -1

let appHeight = 0
let appWidth = 0
let panned = -1

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

function publish() {
  const next = measured || (expecting ? expected : 0)
  if (next === published) return
  published = next
  document.documentElement.style.setProperty('--kb-inset', `${next}px`)
  document.documentElement.toggleAttribute('data-keyboard', next > 0)
  listeners.forEach((listener) => listener())
}

function publishHeight(next: number) {
  if (next === appHeight) return
  appHeight = next
  document.documentElement.style.setProperty('--app-height', `${next}px`)
}

function publishTop(next: number) {
  if (next === panned) return
  panned = next
  document.documentElement.style.setProperty('--vv-top', `${next}px`)
  listeners.forEach((listener) => listener())
}

export function viewportHeight(): number {
  return appHeight || document.documentElement.clientHeight
}

export function viewportTop(): number {
  return Math.max(0, panned)
}

export function visibleBottom(): number {
  return viewportHeight() - keyboardHeight() - viewportTop()
}

export function keyboardHeight(): number {
  return Math.max(0, published)
}

export function subscribeKeyboard(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function expectKeyboard(on: boolean) {
  if (expecting === on) return
  expecting = on
  publish()
}

export function startKeyboardViewport(): () => void {
  const root = document.documentElement
  const vv = window.visualViewport
  expected = readStored()

  const reset = () => {
    measured = 0
    expecting = false
    published = -1
    appHeight = 0
    appWidth = 0
    panned = -1
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--app-height')
    root.style.removeProperty('--vv-top')
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
    publishTop(0)
    publish()
    return reset
  }

  let frame = 0
  const measure = () => {
    frame = 0
    anchor()
    const top = Math.max(0, Math.round(vv.offsetTop))
    publishTop(top)
    const gap = Math.max(0, appHeight - vv.height - top)
    const next = gap >= KEYBOARD_MIN ? Math.round(gap) : 0
    if (next === measured) return
    measured = next
    if (next > expected) {
      expected = next
      writeStored(next)
    }
    publish()
  }
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(measure)
  }

  measure()
  publish()
  vv.addEventListener('resize', schedule)
  vv.addEventListener('scroll', schedule)
  window.addEventListener('orientationchange', schedule)

  return () => {
    window.cancelAnimationFrame(frame)
    vv.removeEventListener('resize', schedule)
    vv.removeEventListener('scroll', schedule)
    window.removeEventListener('orientationchange', schedule)
    reset()
  }
}
