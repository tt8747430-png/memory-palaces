import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isTextField,
  keyboardIsMeasured,
  revealOffset,
  visibleBottom,
  REVEAL_SCROLL_ATTR,
} from '@/shared/lib'

export interface ViewportSample {
  route: string
  mode: string
  layoutHeight: number
  layoutWidth: number
  vvHeight: number
  vvOffsetTop: number
  vvScale: number
  appHeight: string
  kbInset: string
  kbRange: string
  /** `false` while `--kb-inset` is the remembered height standing in for a measurement. */
  kbMeasured: boolean
  keyboardAttr: boolean
  scroller: string
  scrollTop: number
  scrollMax: number
  padBottom: number
  htmlRectTop: number
  rootRectTop: number
  visibleBottom: number
  headerTop: number
  headerBottom: number
  footerTop: number
  bandTop: number
  bandBottom: number
  focused: string
  focusedTop: number
  focusedBottom: number
  fieldInScroller: boolean
  revealDelta: number
  stored: string
  at: number
}

const round = (value: number | undefined, fallback = -1) =>
  value === undefined ? fallback : Math.round(value)

const px = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * The node the reveal is actually attached to, preferring the one holding the focused field —
 * `AppScreen`, `AuthScreen` and every open `CardFace` each attach their own.
 */
function revealScroller(active: Element | null): HTMLElement | null {
  const owner = active?.closest(`[${REVEAL_SCROLL_ATTR}]`)
  if (owner instanceof HTMLElement) return owner
  const first = document.querySelector(`[${REVEAL_SCROLL_ATTR}]`)
  return first instanceof HTMLElement ? first : null
}

export function readViewport(): ViewportSample {
  const root = document.documentElement
  const vv = window.visualViewport
  const style = root.style
  const active = document.activeElement
  const attached = revealScroller(active)
  const scroller = attached ?? document.querySelector('main')
  // Exactly the lookups `useKeyboardReveal` makes, so the band below is the band it would use.
  const header =
    scroller?.parentElement?.querySelector('[data-slot="header-bar"]') ??
    document.querySelector('[data-slot="header-bar"]')
  const footer = scroller?.querySelector('[data-slot="footer-bar"]')
  const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : undefined
  const headerRect = header?.getBoundingClientRect()
  const scrollerRect = scroller?.getBoundingClientRect()
  const band = {
    top: Math.max(scrollerRect?.top ?? 0, headerRect?.bottom ?? 0),
    bottom: Math.min(
      scrollerRect?.bottom ?? Infinity,
      visibleBottom(),
      footer?.getBoundingClientRect().top ?? Infinity,
    ),
  }
  const fieldInScroller = Boolean(isTextField(active) && scroller?.contains(active))

  return {
    route: window.location.pathname,
    mode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    layoutHeight: root.clientHeight,
    layoutWidth: root.clientWidth,
    vvHeight: round(vv?.height, 0),
    vvOffsetTop: round(vv?.offsetTop, 0),
    vvScale: vv ? Math.round(vv.scale * 100) / 100 : 1,
    appHeight: style.getPropertyValue('--app-height') || '(unset)',
    kbInset: style.getPropertyValue('--kb-inset') || '(unset)',
    kbRange: style.getPropertyValue('--kb-range') || '(unset)',
    kbMeasured: keyboardIsMeasured(),
    keyboardAttr: root.hasAttribute('data-keyboard'),
    scroller: scroller
      ? `${scroller.tagName.toLowerCase()}${attached ? ' (reveal)' : ' (no reveal)'}`
      : '(none)',
    scrollTop: round(scroller?.scrollTop),
    scrollMax: scroller ? Math.round(scroller.scrollHeight - scroller.clientHeight) : -1,
    padBottom: scroller
      ? Math.round(Number.parseFloat(getComputedStyle(scroller).paddingBottom))
      : -1,
    htmlRectTop: Math.round(root.getBoundingClientRect().top),
    rootRectTop: round(document.getElementById('root')?.getBoundingClientRect().top),
    visibleBottom: Math.round(visibleBottom()),
    headerTop: round(headerRect?.top),
    headerBottom: round(headerRect?.bottom),
    footerTop: round(footer?.getBoundingClientRect().top),
    bandTop: Math.round(band.top),
    bandBottom: Number.isFinite(band.bottom) ? Math.round(band.bottom) : -1,
    focused: active?.tagName.toLowerCase() ?? '(none)',
    focusedTop: round(rect?.top),
    focusedBottom: round(rect?.bottom),
    fieldInScroller,
    revealDelta: fieldInScroller && rect ? Math.round(revealOffset(band, rect)) : 0,
    stored: localStorage.getItem('mindscape.keyboard-height') ?? '(none)',
    at: Date.now(),
  }
}

export interface ProbeCheck {
  id: string
  label: string
  /** `idle` is "nothing to judge yet" — no keyboard, no field — not a pass. */
  state: 'ok' | 'bad' | 'idle'
  detail: string
}

/**
 * The readout says what the numbers are; this says which of them is the fault. Every check is a
 * sentence from ADR 0002 turned into arithmetic, so a still reading can be pasted into a bug
 * report and read by someone who was not holding the phone.
 */
export function checkViewport(sample: ViewportSample): ProbeCheck[] {
  const app = px(sample.appHeight) || sample.layoutHeight
  const inset = px(sample.kbInset)
  const range = px(sample.kbRange)
  const stored = Number.parseInt(sample.stored, 10)
  const sum = sample.vvOffsetTop + sample.vvHeight + inset
  const slack = sample.scrollMax - sample.scrollTop
  /** The keyboard's own height, in screen space — what the inset would be with no pan under it. */
  const keyboard = app - sample.vvHeight
  // The attribute, not the inset: a keyboard iOS has panned nearly out of the layout viewport is up,
  // and covering almost none of the shell.
  const open = sample.keyboardAttr
  const delta = sample.revealDelta
  const available = delta > 0 ? slack : sample.scrollTop

  return [
    {
      id: 'pan',
      label: 'no pan',
      state: sample.vvOffsetTop === 0 ? 'ok' : 'bad',
      detail:
        sample.vvOffsetTop === 0
          ? 'visualViewport top 0 — the app revealed its own field'
          : `iOS panned ${sample.vvOffsetTop}px: it was left a field to reveal`,
    },
    {
      id: 'field',
      label: 'field in band',
      state: !sample.fieldInScroller ? 'idle' : delta === 0 ? 'ok' : 'bad',
      detail: !sample.fieldInScroller
        ? sample.focused === '(none)' || sample.focused === 'body'
          ? 'no field focused'
          : `${sample.focused} is not inside the reveal scroll body`
        : delta === 0
          ? `inside ${sample.bandTop}…${sample.bandBottom}`
          : `${Math.abs(delta)}px ${delta < 0 ? 'above' : 'below'} the band ${sample.bandTop}…${sample.bandBottom}`,
    },
    {
      // The reveal is `node.scrollTop += delta` and nothing more: without the room to move, it
      // writes a number the scroller clamps away and iOS finishes the job by panning.
      id: 'slack',
      label: 'scroll range',
      state: delta === 0 ? 'idle' : available >= Math.abs(delta) ? 'ok' : 'bad',
      detail:
        delta === 0
          ? `${slack}px below, ${sample.scrollTop}px above`
          : available >= Math.abs(delta)
            ? `${available}px ${delta > 0 ? 'below' : 'above'}, needs ${Math.abs(delta)}px`
            : `clamped: ${available}px ${delta > 0 ? 'below' : 'above'} of the ${Math.abs(delta)}px the reveal needs`,
    },
    {
      id: 'padding',
      label: '.pb-keyboard',
      state: !open ? 'idle' : sample.padBottom >= range ? 'ok' : 'bad',
      detail: !open
        ? 'keyboard closed'
        : sample.padBottom >= range
          ? `padding-bottom ${sample.padBottom} ≥ --kb-range ${range}`
          : `padding-bottom ${sample.padBottom} < --kb-range ${range}: this scroll body has no keyboard range`,
    },
    {
      // Not "is the inset large enough" — an inset below the remembered height is *correct* under a
      // pan, and comparing the two is what let the fault below read as clean. The only question a
      // still reading cannot answer for itself: is this a measurement at all, or the reserve?
      id: 'inset',
      label: 'keyboard measured',
      state: !open ? 'idle' : sample.kbMeasured ? 'ok' : 'bad',
      detail: !open
        ? 'keyboard closed'
        : sample.kbMeasured
          ? sample.vvOffsetTop === 0
            ? `${inset}px measured`
            : `${inset}px of a ${keyboard}px keyboard: the other ${sample.vvOffsetTop}px is panned out of the layout viewport`
          : `${inset}px reserved${Number.isFinite(stored) ? ` from the remembered ${stored}px` : ''}: the keyboard never reported itself, so the reveal band sits ${sum - app}px above the screen`,
    },
    {
      // This is a health check, and the only one that catches a live reserve: `--kb-inset` balances
      // by construction *while it is a measurement*, and the case worth catching is the one where it
      // is not. (ADR 0002 said the opposite until a device reading proved otherwise.)
      id: 'balance',
      label: 'top+vv+kb',
      state: sum === app ? 'ok' : 'bad',
      detail:
        sum === app
          ? `${sum} = --app-height`
          : !sample.kbMeasured
            ? `${sum} ≠ ${app}: --kb-inset is the reserve, and the keyboard under it covers ${Math.max(0, keyboard - sample.vvOffsetTop)}px`
            : `${sum} ≠ ${app}: read ${sum - app}px mid-resize — --kb-inset is a frame behind visualViewport`,
    },
    {
      id: 'chrome',
      label: 'shell anchored',
      state: sample.htmlRectTop === 0 && sample.rootRectTop === 0 ? 'ok' : 'bad',
      detail:
        sample.htmlRectTop === 0 && sample.rootRectTop === 0
          ? 'html and #root at 0'
          : `#root at ${sample.rootRectTop}: the shell slid, rects carry the pan`,
    },
    {
      id: 'scroller',
      label: 'reveal attached',
      state: sample.scroller.includes('(reveal)') ? 'ok' : 'bad',
      detail: sample.scroller.includes('(reveal)')
        ? `${sample.scroller} owns the reveal`
        : `${sample.scroller}: no useKeyboardReveal on this scroll body`,
    },
    {
      id: 'zoom',
      label: 'unzoomed',
      state: sample.vvScale === 1 ? 'ok' : 'bad',
      detail:
        sample.vvScale === 1
          ? 'scale 1'
          : `scale ${sample.vvScale}: measurement is frozen until the zoom is released`,
    },
  ]
}

export const SAMPLE_ROWS: [keyof ViewportSample, string][] = [
  ['route', 'route'],
  ['mode', 'display mode'],
  ['layoutHeight', 'layout viewport h'],
  ['layoutWidth', 'layout viewport w'],
  ['vvHeight', 'visualViewport h'],
  ['vvOffsetTop', 'visualViewport top'],
  ['vvScale', 'visualViewport scale'],
  ['appHeight', '--app-height'],
  ['kbInset', '--kb-inset'],
  ['kbRange', '--kb-range'],
  ['kbMeasured', '--kb-inset measured'],
  ['keyboardAttr', 'data-keyboard'],
  ['stored', 'remembered kb'],
  ['scroller', 'scroll body'],
  ['scrollTop', 'scrollTop'],
  ['scrollMax', 'scrollTop max'],
  ['padBottom', 'scroll padding-bottom'],
  ['htmlRectTop', 'html rect top'],
  ['rootRectTop', '#root rect top'],
  ['headerTop', 'header top'],
  ['headerBottom', 'header bottom'],
  ['footerTop', 'footer top'],
  ['bandTop', 'reveal band top'],
  ['bandBottom', 'reveal band bottom'],
  ['visibleBottom', 'visibleBottom()'],
  ['focused', 'focused element'],
  ['focusedTop', 'focused top'],
  ['focusedBottom', 'focused bottom'],
  ['revealDelta', 'reveal delta'],
]

const MARK: Record<ProbeCheck['state'], string> = { ok: 'ok  ', bad: 'FAIL', idle: '--  ' }

const LABEL_WIDTH = Math.max(...SAMPLE_ROWS.map(([, label]) => label.length))

const rowLines = (sample: ViewportSample) =>
  SAMPLE_ROWS.map(([key, label]) => `${label.padEnd(LABEL_WIDTH)}  ${String(sample[key])}`)

const checkLines = (sample: ViewportSample) =>
  checkViewport(sample).map(
    (check) => `${MARK[check.state]}  ${check.label.padEnd(18)}  ${check.detail}`,
  )

/** The whole reading as pasteable text: every row, every verdict, and what was holding it. */
export function sampleToText(sample: ViewportSample): string {
  return [
    'mindscape viewport probe',
    new Date(sample.at).toISOString(),
    navigator.userAgent,
    '',
    ...rowLines(sample),
    '',
    ...checkLines(sample),
    '',
  ].join('\n')
}

/**
 * One keyboard, from the resting reading it interrupted to the reading it settled into. The pair is
 * the unit worth reading: every number here is a difference — the pan, the inset, the rects, the
 * scroll position — and a single reading forces whoever gets it to guess at the other half.
 */
export interface KeyboardEpisode {
  /** The last reading taken with no keyboard and no reserve. `null` if the probe started mid-open. */
  before: ViewportSample | null
  /**
   * The reading the keyboard **settled** into — the last open frame whose numbers agree with each
   * other. Emphatically not the last open frame: iOS dismisses a keyboard over several frames, the
   * probe samples faster than the module re-measures, and the final frame with a non-zero inset is
   * one frame into the close — a restored `visualViewport` against an inset from the frame before
   * it. Four of the first five device readings were that frame, and every verdict on them was noise.
   */
  after: ViewportSample
  /** Still on screen: `after` is this keyboard's own reading rather than the one it closed on. */
  live: boolean
}

/** How many keyboards are kept. Older ones fall off the front. */
export const EPISODE_LIMIT = 5

export function isKeyboardOpen(sample: ViewportSample): boolean {
  return sample.keyboardAttr
}

/**
 * Whether a reading's three viewport numbers agree. They are one identity — pan + visual viewport +
 * inset = the anchored shell — so a reading that breaks it was taken either mid-resize, with a fresh
 * `visualViewport` against an inset a frame behind it, or on a reserve that never became a
 * measurement. Neither is a reading of the keyboard that was up.
 */
export function isSettled(sample: ViewportSample): boolean {
  const app = px(sample.appHeight) || sample.layoutHeight
  return sample.vvOffsetTop + sample.vvHeight + px(sample.kbInset) === app
}

function diffLines(before: ViewportSample, after: ViewportSample): string[] {
  const changed = SAMPLE_ROWS.filter(([key]) => String(before[key]) !== String(after[key]))
  if (changed.length === 0) return ['(nothing moved)']
  return changed.map(
    ([key, label]) =>
      `${label.padEnd(LABEL_WIDTH)}  ${String(before[key])} → ${String(after[key])}`,
  )
}

function episodeToText(episode: KeyboardEpisode, index: number, total: number): string {
  const { before, after, live } = episode
  const head = `═══ keyboard ${index + 1} of ${total}${live ? ' (live)' : ''} · ${new Date(after.at).toISOString()}`
  const body = before
    ? [
        `─── before (keyboard closed) ───`,
        ...rowLines(before),
        '',
        `─── after (+${after.at - before.at}ms) ───`,
        ...rowLines(after),
        '',
        '─── what the keyboard moved ───',
        ...diffLines(before, after),
      ]
    : [
        '─── before ───',
        '(none: the probe started with the keyboard already up)',
        '',
        '─── after ───',
        ...rowLines(after),
      ]
  return [head, '', ...body, '', ...checkLines(after)].join('\n')
}

/** Every kept keyboard, newest last, each as its own before/after block. */
export function episodesToText(episodes: KeyboardEpisode[]): string {
  if (episodes.length === 0) {
    return 'mindscape viewport probe\nno keyboard opened yet — focus a field, then copy.\n'
  }
  return [
    `mindscape viewport probe — ${episodes.length} keyboard${episodes.length === 1 ? '' : 's'}, oldest first`,
    navigator.userAgent,
    '',
    ...episodes.map((episode, index) => episodeToText(episode, index, episodes.length)),
    '',
  ].join('\n\n')
}

/** Enough to cover a focus, a keyboard animation and a long drag at ~60fps. */
const TRACE_LIMIT = 900

const TRACE_COLUMNS = [
  'at',
  'vvOffsetTop',
  'vvHeight',
  'kbInset',
  'kbRange',
  'scrollTop',
  'scrollMax',
  'padBottom',
  'htmlRectTop',
  'rootRectTop',
  'headerTop',
  'bandTop',
  'bandBottom',
  'visibleBottom',
  'focusedTop',
  'focusedBottom',
  'revealDelta',
] as const satisfies readonly (keyof ViewportSample)[]

export function traceToTsv(trace: ViewportSample[]): string {
  if (trace.length === 0) return ''
  const start = trace[0]?.at ?? 0
  const rows = trace.map((sample) =>
    TRACE_COLUMNS.map((key) => (key === 'at' ? sample.at - start : sample[key])).join('\t'),
  )
  return [TRACE_COLUMNS.join('\t'), ...rows].join('\n')
}

export interface ViewportProbe {
  sample: ViewportSample
  trace: ViewportSample[]
  recording: boolean
  /**
   * Read at press time rather than held in state: the pairs update every frame, and re-rendering
   * the panel for a history nobody is looking at until they tap `copy` buys nothing.
   */
  episodes: () => KeyboardEpisode[]
  /** How many pairs `episodes()` would return, including the one on screen. For the button label. */
  episodeCount: number
  toggleRecording: () => void
  clear: () => void
}

/**
 * Samples the viewport every frame, and keeps the last `EPISODE_LIMIT` keyboards as before/after
 * pairs. The trace is what makes this worth having: none of these faults are observable in a still
 * reading — they live in how the numbers move against a finger.
 */
export function useViewportProbe(): ViewportProbe {
  const [sample, setSample] = useState<ViewportSample>(() => readViewport())
  const [trace, setTrace] = useState<ViewportSample[]>([])
  const [recording, setRecording] = useState(false)
  const recordingRef = useRef(recording)
  recordingRef.current = recording

  const sealed = useRef<KeyboardEpisode[]>([])
  const resting = useRef<ViewportSample | null>(null)
  const opened = useRef<ViewportSample | null>(null)
  const latest = useRef<ViewportSample | null>(null)
  const settled = useRef<ViewportSample | null>(null)
  const [episodeCount, setEpisodeCount] = useState(0)

  useEffect(() => {
    let open = false
    let frame = 0

    const tick = () => {
      const next = readViewport()
      setSample(next)
      if (recordingRef.current) {
        setTrace((current) => (current.length >= TRACE_LIMIT ? current : [...current, next]))
      }

      // The reserve raises `--kb-inset` on `focusin`, a frame or more before the keyboard reports
      // itself, so this edge is the focus — which is exactly the boundary worth pairing across.
      const nowOpen = isKeyboardOpen(next)
      if (nowOpen && !open) {
        opened.current = resting.current
        setEpisodeCount(Math.min(sealed.current.length + 1, EPISODE_LIMIT))
      } else if (!nowOpen && open) {
        // The settled frame if there was one, and the last frame otherwise: a keyboard reported
        // badly still beats a keyboard dropped, and "nothing ever settled" is itself the reading.
        const after = settled.current ?? latest.current
        if (after) {
          sealed.current = [
            ...sealed.current,
            { before: opened.current, after, live: false },
          ].slice(-EPISODE_LIMIT)
        }
        setEpisodeCount(sealed.current.length)
        opened.current = null
        latest.current = null
        settled.current = null
      }
      open = nowOpen
      if (nowOpen) {
        latest.current = next
        if (isSettled(next)) settled.current = next
      } else resting.current = next

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const episodes = useCallback((): KeyboardEpisode[] => {
    const after = settled.current ?? latest.current
    const live = after ? [{ before: opened.current, after, live: true }] : []
    return [...sealed.current, ...live].slice(-EPISODE_LIMIT)
  }, [])

  const toggleRecording = useCallback(() => {
    setRecording((current) => {
      if (!current) setTrace([])
      return !current
    })
  }, [])

  const clear = useCallback(() => {
    setTrace([])
    sealed.current = []
    setEpisodeCount(latest.current ? 1 : 0)
  }, [])

  return { sample, trace, recording, episodes, episodeCount, toggleRecording, clear }
}
