import { useState } from 'react'
import { cn, keepFieldFocused, setProbeOverlay, useProbeOverlay } from '@/shared/lib'
import { traceToTsv, useViewportProbe } from '@/widgets/dev-probe'
import { ViewportReadout } from './ViewportReadout'

const ACTION =
  'rounded-control border border-border px-2 py-1 text-(length:--p-text-tiny) font-semibold text-heading'

/**
 * The viewport probe, readable on the route that is misbehaving. `/dev/kitchen-sink` shows the same
 * numbers, but a keyboard fault only reproduces on the screen that has the fault — reading it
 * somewhere else is how three fixes shipped on inference. Nothing here carries a `data-slot`, so it
 * is invisible to the chrome compensation it exists to measure.
 */
export function ProbeOverlay() {
  const visible = useProbeOverlay()
  if (!visible) return null
  return <ProbePanel />
}

function ProbePanel() {
  const { sample, trace, recording, toggleRecording } = useViewportProbe()
  const [collapsed, setCollapsed] = useState(false)
  const [bottom, setBottom] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(traceToTsv(trace))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      onMouseDown={keepFieldFocused}
      className={cn(
        'fixed inset-x-2 z-2000000000 rounded-card border border-border bg-card/95 p-2 shadow-elevated backdrop-blur-md',
        bottom ? 'bottom-2' : 'top-2',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="mr-auto text-(length:--p-text-tiny) font-bold text-heading">
          viewport probe
        </span>
        <button type="button" className={ACTION} onClick={() => setBottom((value) => !value)}>
          {bottom ? '↑' : '↓'}
        </button>
        <button type="button" className={ACTION} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? 'show' : 'hide'}
        </button>
        <button type="button" className={ACTION} onClick={() => setProbeOverlay(false)}>
          off
        </button>
      </div>

      {collapsed ? null : (
        <>
          <ViewportReadout sample={sample} className="mt-2" />
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              className={cn(ACTION, recording && 'border-destructive text-(--danger-on-surface)')}
              onClick={toggleRecording}
            >
              {recording ? 'stop' : 'record'}
            </button>
            <button type="button" className={ACTION} onClick={() => void copy()}>
              {copied ? 'copied' : `copy ${trace.length}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
