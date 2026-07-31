import { cn } from '@/shared/lib'
import type { ViewportSample } from '../model/viewport-sample'

const LABEL = 'absolute text-(length:--p-text-tiny) font-semibold tabular-nums'

/**
 * The screen to scale, in the one coordinate space that matters: layout pixels below the anchored
 * shell's top. Rects convert through `html`'s own rect top — the bridge `visibleBottom()` uses — so
 * a field drawn outside the band really is outside it, not a space-conversion mistake drawn twice.
 */
export function BandDiagram({ sample, className }: { sample: ViewportSample; className?: string }) {
  const app = Number.parseInt(sample.appHeight, 10) || sample.layoutHeight
  if (app <= 0) return null

  const inset = Number.parseInt(sample.kbInset, 10) || 0
  // Rect → layout: `html`'s rect top is 0 where rects are layout-relative, −pan where they carry it.
  const toLayout = (rectY: number) => rectY - sample.htmlRectTop
  const pct = (layoutY: number) => (layoutY / app) * 100
  const clamped = (value: number) => Math.min(100, Math.max(0, value))

  const bandTop = toLayout(sample.bandTop)
  const bandBottom = toLayout(sample.bandBottom)
  const fieldTop = toLayout(sample.focusedTop)
  const fieldBottom = toLayout(sample.focusedBottom)
  const hasBand = sample.bandBottom >= 0 && bandBottom > bandTop
  const hasField = sample.fieldInScroller
  const offScale = hasField && (fieldBottom < 0 || fieldTop > app)
  const away =
    fieldTop > app ? `${Math.round(fieldTop - app)}px below` : `${Math.round(-fieldBottom)}px above`

  return (
    <div className={cn('relative', className)}>
      <div className="relative h-40 overflow-hidden rounded-card border border-border bg-surface">
        {/* The keyboard: the bottom of the anchored shell, covered. */}
        {inset > 0 ? (
          <div
            className="absolute inset-x-0 bottom-0 border-t border-dashed border-border bg-muted/60"
            style={{ height: `${clamped(pct(inset))}%` }}
          >
            <span className={cn(LABEL, 'top-0.5 left-1 text-muted-foreground')}>
              keyboard {inset}
            </span>
          </div>
        ) : null}

        {/* What iOS took for itself. Zero is the whole point of the design. */}
        {sample.vvOffsetTop > 0 ? (
          <div
            className="absolute inset-x-0 top-0 bg-(--danger-surface)"
            style={{ height: `${clamped(pct(sample.vvOffsetTop))}%` }}
          >
            <span className={cn(LABEL, 'top-0.5 left-1 text-(--danger-on-surface)')}>
              pan {sample.vvOffsetTop}
            </span>
          </div>
        ) : null}

        {/* Where the reveal is allowed to put the field. */}
        {hasBand ? (
          <div
            className="absolute inset-x-0 border-y border-(--success-on-surface)/40 bg-(--success-surface)/70"
            style={{
              top: `${clamped(pct(bandTop))}%`,
              height: `${clamped(pct(bandBottom - bandTop))}%`,
            }}
          >
            <span className={cn(LABEL, 'right-1 bottom-0.5 text-(--success-on-surface)')}>
              band {Math.round(bandTop)}…{Math.round(bandBottom)}
            </span>
          </div>
        ) : null}

        {/* The focused field, red the moment it leaves the band. */}
        {hasField && !offScale ? (
          <div
            className={cn(
              'absolute inset-x-6 rounded-xs',
              sample.revealDelta === 0
                ? 'bg-(--success-on-surface)'
                : 'bg-(--danger-on-surface) ring-2 ring-(--danger-on-surface)/40',
            )}
            style={{
              top: `${clamped(pct(fieldTop))}%`,
              height: `${Math.max(1.5, clamped(pct(fieldBottom - fieldTop)))}%`,
            }}
          />
        ) : null}

        {hasField && offScale ? (
          <div
            className={cn(
              'absolute inset-x-0 flex justify-center bg-(--danger-surface) py-0.5',
              fieldTop > app ? 'bottom-0' : 'top-0',
            )}
          >
            <span className="text-(length:--p-text-tiny) font-semibold text-(--danger-on-surface)">
              field off-scale, {away}
            </span>
          </div>
        ) : null}

        {!hasField ? (
          <span
            className={cn(
              LABEL,
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground',
            )}
          >
            no field focused
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex justify-between text-(length:--p-text-tiny) text-muted-foreground tabular-nums">
        <span>0</span>
        <span>--app-height {app}</span>
      </div>
    </div>
  )
}
