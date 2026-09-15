import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isKeyboardOpen,
  isSettled,
  type KeyboardEpisode,
  readViewport,
  type ViewportSample,
} from './viewport-sample'

export const EPISODE_LIMIT = 5

const TRACE_LIMIT = 900

export interface ViewportProbe {
  sample: ViewportSample
  trace: ViewportSample[]
  recording: boolean
  episodes: () => KeyboardEpisode[]
  episodeCount: number
  toggleRecording: () => void
  clear: () => void
}

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

      const nowOpen = isKeyboardOpen(next)
      if (nowOpen && !open) {
        opened.current = resting.current
        setEpisodeCount(Math.min(sealed.current.length + 1, EPISODE_LIMIT))
      } else if (!nowOpen && open) {
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
