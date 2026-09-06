import { useState } from 'react'
import { cn, keepFieldFocused, setProbeOverlay, useProbeOverlay } from '@/shared/lib'
import {
  BandDiagram,
  CopyButton,
  episodesToText,
  PROBE_ACTION,
  sampleToText,
  traceToTsv,
  useViewportProbe,
} from '@/widgets/dev-probe'
import { ViewportReadout } from './ViewportReadout'

/**
 * The viewport probe, readable on the route that is misbehaving. `/dev/kitchen-sink` shows the same
 * numbers, but a keyboard fault only reproduces on the screen that has it — reading it elsewhere is
 * how three fixes shipped on inference. Nothing here carries a `data-slot`: `header`/`footer-bar`
 * are what the reveal band is built from, so an overlay wearing one would move the band it measures.
 */
export function ProbeOverlay() {
  const visible = useProbeOverlay()
  if (!visible) return null
  return <ProbePanel />
}

function ProbePanel() {
  const { sample, trace, recording, episodes, episodeCount, toggleRecording } = useViewportProbe()
  const [collapsed, setCollapsed] = useState(false)
  const [bottom, setBottom] = useState(false)
  const [rows, setRows] = useState(false)

  return (
    <div
      onMouseDown={keepFieldFocused}
      className={cn(
        'fixed inset-x-2 z-(--z-dev-probe) max-h-[calc(var(--app-height)*0.7)] overflow-y-auto overscroll-contain rounded-card border border-border bg-card/95 p-2 shadow-elevated backdrop-blur-md',
        // Both edges are measured from the inset, never from the display edge: a bare `top-2` put
        // the readout under the clock wherever the web view runs full-bleed, and a bare `bottom-2`
        // put it under the home indicator. The numbers this panel exists to show are unreadable
        // exactly where they matter most.
        bottom
          ? 'bottom-[calc(var(--p-safe-bottom)+0.5rem)]'
          : 'top-[calc(env(safe-area-inset-top)+0.5rem)]',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="mr-auto text-tiny font-bold text-heading">viewport probe</span>
        <button type="button" className={PROBE_ACTION} onClick={() => setBottom((value) => !value)}>
          {bottom ? '↑' : '↓'}
        </button>
        <button
          type="button"
          className={PROBE_ACTION}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? 'show' : 'hide'}
        </button>
        <button type="button" className={PROBE_ACTION} onClick={() => setProbeOverlay(false)}>
          off
        </button>
      </div>

      {collapsed ? null : (
        <>
          <BandDiagram sample={sample} className="mt-2" />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CopyButton label={`copy ${episodeCount} kb`} text={() => episodesToText(episodes())} />
            <CopyButton label="copy now" text={() => sampleToText(sample)} />
            <button
              type="button"
              className={cn(
                PROBE_ACTION,
                recording && 'border-destructive text-(--danger-on-surface)',
              )}
              onClick={toggleRecording}
            >
              {recording ? 'stop' : 'record'}
            </button>
            <CopyButton label={`trace ${trace.length}`} text={() => traceToTsv(trace)} />
            <button
              type="button"
              className={cn(PROBE_ACTION, 'ml-auto')}
              onClick={() => setRows((value) => !value)}
            >
              {rows ? 'verdicts' : 'rows'}
            </button>
          </div>
          <ViewportReadout sample={sample} className="mt-2" rows={rows} />
        </>
      )}
    </div>
  )
}
