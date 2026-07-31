const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

/**
 * Gap between a revealed field and the keyboard. Lives here rather than in `use-keyboard-reveal`,
 * which applies it, because it is also published as scroll **range** — without that range
 * `scrollTop` clamps at the end of the content, the last field stays covered, and iOS pans to
 * finish the reveal. Leave the platform nothing to do.
 */
export const REVEAL_GAP = 24

/** How much of the anchored shell's bottom is still covered, in *layout* space. `--kb-inset`. */
let hidden = 0
/**
 * Whether a keyboard is up at all — a different question from `hidden`, never the same number. The
 * pan moves part of the covered area out of the layout viewport, so a full-height keyboard can
 * legitimately hide very little of the shell.
 */
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

/**
 * Publishes the inset; reports whether it moved. Attribute answers "is a keyboard up", inset
 * answers "how much does it cover". Keeping them apart is what lets a keyboard panned almost out of
 * the layout viewport still unstick the footer dock and hide the nav.
 */
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

/** The published inset: how much of the shell's bottom is covered, pan already taken out. */
export function keyboardHeight(): number {
  return Math.max(0, published)
}

/**
 * Is `--kb-inset` a measurement, or the remembered height still standing in for one? Probe is the
 * only caller: the two are indistinguishable in a still reading, and a reserve that outlives the
 * keyboard reporting itself is the one fault that puts the whole reveal band off screen.
 */
export function keyboardIsMeasured(): boolean {
  return present
}

/**
 * Bottom of the usable area, in rect space — the only arithmetic in the app bridging the two
 * coordinate spaces. Visible area ends `--kb-inset` above the shell's bottom in *layout* space;
 * `html`'s rect top says where that space begins in *rect* space: `0` when rects are
 * layout-relative, `−pan` when the UA reports them against the visual viewport. Read live, never
 * cached — a cached copy is wrong in exactly the case that matters, a pan with no resize.
 */
export function visibleBottom(): number {
  const originTop = document.documentElement.getBoundingClientRect().top
  return originTop + viewportHeight() - keyboardHeight()
}

/** Fires once per keyboard event, and never for a scroll: nothing here listens to one. */
export function subscribeKeyboardHeight(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * A field took or lost focus. `focusin` fires before the keyboard reports itself, so reserve the
 * remembered height up front: the reveal needs its scroll range to exist in the same frame it
 * scrolls, or it cannot lift the field and the platform pans to fill the gap.
 */
export function expectKeyboard(on: boolean) {
  if (expecting === on) return
  expecting = on
  // Bridges the frames before the keyboard reports itself — nothing to bridge once it is up and
  // measured. Must end at the first measurement, not at blur: iOS dismisses without blurring
  // (swipe-down, `Done`), so a reserve keyed to focus is republished over that measurement forever
  // and the page keeps a keyboard-shaped hole under it.
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

    // Layout viewport — pinch-zoom never touches it. Safe before the guard.
    anchor()

    // Zoom shrinks vv.height and pans offsetTop exactly like the keyboard; scale is the only tell.
    // iOS ignores user-scalable=no, so it is reachable. Freeze on last unzoomed read.
    if (vv.scale !== 1) return

    // Screen space: the keyboard's own height, pan or no pan. `KEYBOARD_MIN` tells a keyboard from
    // a lone accessory bar, so it belongs on this number. On the pan-reduced inset it is a category
    // error with teeth: a keyboard panned by more than `keyboard − KEYBOARD_MIN` reads as no
    // keyboard, `reserving` never clears, and the whole episode runs on the remembered full height
    // — so `visibleBottom()` lands the band a pan above the screen and iOS keeps panning to reveal
    // a field the app just scrolled out of sight. Device (iOS 26, standalone): shell 793, viewport
    // 390, pan 289 — a 403px keyboard that read as 114.
    const keyboard = Math.max(0, Math.round(appHeight - vv.height))
    present = keyboard >= KEYBOARD_MIN

    // Layout space, and all `--kb-inset` has ever meant. The pan moves the rest of the covered area
    // out of the layout viewport — the only thing this module reads the pan for.
    hidden = present ? Math.max(0, keyboard - Math.max(0, Math.round(vv.offsetTop))) : 0

    if (present) {
      // Measurement rules from here, including when it says the keyboard is gone.
      reserving = false
      // The keyboard's own height, never the pan-reduced one: the reserve stands in for a keyboard
      // measured before anything panned, so a remembered panned number under-reserves every later
      // focus by the size of that pan.
      if (keyboard > expected) {
        expected = keyboard
        writeStored(keyboard)
      }
    }

    publish()

    // Unconditionally, not only when the inset moved. A keyboard matching the reserve exactly moves
    // no inset but still moves the pan, and where rects are reported against the visual viewport
    // that is the reveal band moving. Subscribers are idempotent (the reveal writes nothing when
    // the field is already in the band; `useSyncExternalStore` bails on an unchanged snapshot), so
    // a conditional wake-up can only ever buy a missed reveal.
    notify()
  }

  /**
   * `resize` only. `visualViewport` also fires `scroll` every frame of a rubber-band, and every
   * fault this module has had came from reading one: height mid-flight resizes the scroll range
   * under the finger; pan mid-flight drags chrome with it. Nothing is positioned from the pan any
   * more, so `scroll` is not subscribed to at all.
   */
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
