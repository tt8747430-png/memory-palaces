import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isKeyboardOpen,
  isSettled,
  type KeyboardEpisode,
  readViewport,
  type ViewportSample,
} from './viewport-sample'

/** How many keyboards are kept. Older ones fall off the front. */
export const EPISODE_LIMIT = 5

/** Enough to cover a focus, a keyboard animation and a long drag at ~60fps. */
const TRACE_LIMIT = 900

export interface ViewportProbe {
  sample: ViewportSample
  trace: ViewportSample[]
  recording: boolean
  /**
   * Read at press time, not held in state: the pairs update every frame, and re-rendering the panel
   * for a history nobody reads until they tap `copy` buys nothing.
   */
  episodes: () => KeyboardEpisode[]
  /** How many pairs `episodes()` would return, including the live one. For the button label. */
  episodeCount: number
  toggleRecording: () => void
  clear: () => void
}

/**
 * Samples every frame; keeps the last `EPISODE_LIMIT` keyboards as before/after pairs. The trace is
 * what makes it worth having: none of these faults show in a still reading — they live in how the
 * numbers move against a finger.
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
      // itself, so this edge is the focus — exactly the boundary worth pairing across.
      const nowOpen = isKeyboardOpen(next)
      if (nowOpen && !open) {
        opened.current = resting.current
        setEpisodeCount(Math.min(sealed.current.length + 1, EPISODE_LIMIT))
      } else if (!nowOpen && open) {
        // Settled frame if there was one, last frame otherwise: a keyboard reported badly beats a
        // keyboard dropped, and "nothing ever settled" is itself the reading.
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
