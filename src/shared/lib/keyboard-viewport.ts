const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

let measured = 0
let expected = 0
let expecting = false
let published = -1
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
  const next = expecting ? Math.max(measured, expected) : measured
  if (next === published) return
  published = next
  document.documentElement.style.setProperty('--kb-inset', `${next}px`)
  listeners.forEach((listener) => listener())
}

function publishTop(top: number) {
  if (top === panned) return
  panned = top
  document.documentElement.style.setProperty('--vv-top', `${top}px`)
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

  if (!vv) {
    publish()
    publishTop(0)
    return () => {
      published = -1
      panned = -1
      root.style.removeProperty('--kb-inset')
      root.style.removeProperty('--vv-top')
    }
  }

  let frame = 0
  const measure = () => {
    frame = 0
    const top = Math.max(0, Math.round(vv.offsetTop))
    publishTop(top)
    const gap = Math.max(0, root.clientHeight - vv.height - top)
    const next = gap >= KEYBOARD_MIN ? Math.round(gap) : 0
    if (next === measured) return
    measured = next
    if (next > 0 && next !== expected) {
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

  return () => {
    window.cancelAnimationFrame(frame)
    vv.removeEventListener('resize', schedule)
    vv.removeEventListener('scroll', schedule)
    measured = 0
    expecting = false
    published = -1
    panned = -1
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--vv-top')
  }
}
