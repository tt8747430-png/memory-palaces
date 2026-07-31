const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

/**
 * Breathing room between a revealed field and the keyboard — and the reason it lives here rather
 * than in `use-keyboard-reveal`, which is what applies it: it is published as **scroll range** too.
 *
 * Without that range the last field on a page cannot be lifted clear. `scrollTop` clamps at the end
 * of the content, the field stays under the keyboard, and iOS finishes the reveal itself by panning
 * the visual viewport — which is the single event every piece of chrome compensation this module
 * used to carry existed to survive. The cheapest way to keep the app and the screen aligned is to
 * leave the platform nothing to do.
 */
export const REVEAL_GAP = 24

/**
 * How much of the anchored shell's bottom the keyboard still covers, in *layout* coordinates — the
 * number `--kb-inset` publishes.
 */
let hidden = 0
/**
 * Whether a keyboard is on screen at all. A different question from `hidden`, and never the same
 * number: iOS pans the visual viewport, which moves part of the covered area out of the layout
 * viewport, so a full-height keyboard can legitimately hide very little of the shell.
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
 * Publishes the inset and reports whether it moved. The attribute answers "is a keyboard up", the
 * inset answers "how much of the shell does it cover" — keeping them apart is what lets a keyboard
 * iOS has panned almost out of the layout viewport still unstick the footer dock and hide the nav.
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

/** The published inset: how much of the shell's bottom is covered, with the pan already taken out. */
export function keyboardHeight(): number {
  return Math.max(0, published)
}

/**
 * Whether `--kb-inset` is a measurement or the remembered height still standing in for one.
 *
 * The probe is the only caller, and it needs it because the two are indistinguishable in a still
 * reading — and a reserve that outlives the keyboard reporting itself is the one fault that puts the
 * whole reveal band off screen.
 */
export function keyboardIsMeasured(): boolean {
  return present
}

/**
 * The bottom of the usable area, in rect coordinates — the one place the two coordinate spaces
 * meet, and the only arithmetic in the app that bridges them.
 *
 * The visible area ends `--kb-inset` above the anchored shell's bottom in *layout* coordinates, and
 * `html`'s rect top says where those coordinates begin in *rect* ones: `0` where rects are
 * layout-relative, `−pan` where the UA reports them against the visual viewport. Read live rather
 * than cached — a cached copy is wrong in exactly the case that matters, when iOS has panned
 * without resizing anything.
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
 * A field took or lost focus. `focusin` fires before the keyboard reports itself, so the remembered
 * height is reserved up front — the reveal needs the scroll range to exist in the same frame it
 * scrolls, or it cannot lift the field and the platform panning is what fills the gap.
 */
export function expectKeyboard(on: boolean) {
  if (expecting === on) return
  expecting = on
  // The reserve bridges the frames before the keyboard reports itself. Nothing to bridge when it is
  // already up and measured, and it must end at the first measurement rather than at blur: iOS
  // dismisses the keyboard without blurring (swipe-down, `Done`), and a reserve keyed to focus is
  // republished over that measurement forever, leaving a keyboard-shaped hole in the page.
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

    // Zoom shrinks vv.height and pans offsetTop exactly like the keyboard; scale is the only
    // tell. iOS ignores user-scalable=no, so it is reachable. Freeze on last unzoomed read.
    if (vv.scale !== 1) return

    // Screen space: the keyboard's own height, pan or no pan. `KEYBOARD_MIN` separates a keyboard
    // from a lone accessory bar, so this is the number it belongs on. Applied to the pan-reduced
    // inset below it is a category error with teeth: a keyboard panned by more than
    // `keyboard − KEYBOARD_MIN` reads as no keyboard at all, `reserving` never clears, and the app
    // runs the whole keyboard on the remembered height — which is a full keyboard, so
    // `visibleBottom()` lands the reveal band a pan above the screen and iOS keeps panning to
    // reveal a field the app has just scrolled out of sight. Measured on device (iOS 26,
    // standalone): shell 793, visual viewport 390, pan 289 — a 403px keyboard that read as 114.
    const keyboard = Math.max(0, Math.round(appHeight - vv.height))
    present = keyboard >= KEYBOARD_MIN

    // Layout space, and all `--kb-inset` has ever meant: how much of the anchored shell's bottom is
    // still covered. The pan moves the rest of the covered area out of the layout viewport, and
    // that is the only thing this module ever reads the pan for.
    hidden = present ? Math.max(0, keyboard - Math.max(0, Math.round(vv.offsetTop))) : 0

    if (present) {
      // The measurement rules from here, including when it says the keyboard is gone.
      reserving = false
      // The keyboard's own height, never the pan-reduced one. The reserve stands in for a keyboard
      // measured before iOS has panned anything, so remembering the panned number under-reserves
      // every later focus by the size of the pan.
      if (keyboard > expected) {
        expected = keyboard
        writeStored(keyboard)
      }
    }

    publish()

    // Unconditionally, not only when the inset moved: a keyboard whose measurement matches the
    // reserve exactly still moved the pan, and where the UA reports rects against the visual
    // viewport that is the reveal band moving. Subscribers are idempotent — the reveal writes
    // nothing when the field is already inside the band, and `useSyncExternalStore` bails out on an
    // unchanged snapshot — so the only thing a conditional wake-up can buy is a missed reveal.
    notify()
  }

  /**
   * `resize` only. `visualViewport` also fires `scroll` on every frame of a rubber-band, and every
   * fault this module has ever had came from reading one: the height read mid-flight resizes the
   * scroll range under the finger, and the pan read mid-flight moved chrome with it. There is
   * nothing left here that a scroll could tell us — the app no longer positions anything from the
   * pan — so it is not subscribed to at all.
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
