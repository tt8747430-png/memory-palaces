import { useCallback, useEffect, useRef, useState } from 'react'
import { visibleBottom } from '@/shared/lib'

export interface ViewportSample {
  layoutHeight: number
  layoutWidth: number
  vvHeight: number
  vvOffsetTop: number
  appHeight: string
  kbInset: string
  vvTop: string
  panComp: string
  scrollTop: number
  htmlRectTop: number
  rootRectTop: number
  fixedRectTop: number
  visibleBottom: number
  headerTop: number
  headerBottom: number
  footerTop: number
  focused: string
  focusedTop: number
  focusedBottom: number
  stored: string
  at: number
}

const round = (value: number | undefined, fallback = -1) =>
  value === undefined ? fallback : Math.round(value)

export function readViewport(): ViewportSample {
  const root = document.documentElement
  const vv = window.visualViewport
  const style = root.style
  const active = document.activeElement
  const scroller = document.querySelector('main') ?? document.querySelector('[data-card-scroll]')
  const fixed = document.querySelector('[data-slot="viewport-probe"]')
  const header = document.querySelector('[data-slot="header-bar"]')
  const footer = document.querySelector('[data-slot="footer-bar"]')
  const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : undefined
  const headerRect = header?.getBoundingClientRect()
  return {
    layoutHeight: root.clientHeight,
    layoutWidth: root.clientWidth,
    vvHeight: round(vv?.height, 0),
    vvOffsetTop: round(vv?.offsetTop, 0),
    appHeight: style.getPropertyValue('--app-height') || '(unset)',
    kbInset: style.getPropertyValue('--kb-inset') || '(unset)',
    vvTop: style.getPropertyValue('--vv-top') || '(unset)',
    panComp: style.getPropertyValue('--pan-comp') || '(unset)',
    scrollTop: round(scroller?.scrollTop),
    htmlRectTop: Math.round(root.getBoundingClientRect().top),
    rootRectTop: round(document.getElementById('root')?.getBoundingClientRect().top),
    fixedRectTop: round(fixed?.getBoundingClientRect().top),
    visibleBottom: Math.round(visibleBottom()),
    headerTop: round(headerRect?.top),
    headerBottom: round(headerRect?.bottom),
    footerTop: round(footer?.getBoundingClientRect().top),
    focused: active?.tagName.toLowerCase() ?? '(none)',
    focusedTop: round(rect?.top),
    focusedBottom: round(rect?.bottom),
    stored: localStorage.getItem('mindscape.keyboard-height') ?? '(none)',
    at: Date.now(),
  }
}

/** Enough to cover a focus, a keyboard animation and a long drag at ~60fps. */
const TRACE_LIMIT = 900

const TRACE_COLUMNS = [
  'at',
  'vvOffsetTop',
  'vvHeight',
  'vvTop',
  'panComp',
  'kbInset',
  'scrollTop',
  'htmlRectTop',
  'rootRectTop',
  'fixedRectTop',
  'headerTop',
  'visibleBottom',
  'focusedTop',
  'focusedBottom',
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
  toggleRecording: () => void
  clear: () => void
}

/**
 * Samples the viewport every frame. The trace is what makes this worth having: none of these
 * faults are observable in a still reading — they live in how the numbers move against a finger.
 */
export function useViewportProbe(): ViewportProbe {
  const [sample, setSample] = useState<ViewportSample>(() => readViewport())
  const [trace, setTrace] = useState<ViewportSample[]>([])
  const [recording, setRecording] = useState(false)
  const recordingRef = useRef(recording)
  recordingRef.current = recording

  useEffect(() => {
    let frame = 0
    const tick = () => {
      const next = readViewport()
      setSample(next)
      if (recordingRef.current) {
        setTrace((current) => (current.length >= TRACE_LIMIT ? current : [...current, next]))
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleRecording = useCallback(() => {
    setRecording((current) => {
      if (!current) setTrace([])
      return !current
    })
  }, [])

  const clear = useCallback(() => setTrace([]), [])

  return { sample, trace, recording, toggleRecording, clear }
}
