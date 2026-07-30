import { cn } from '@/shared/lib'
import type { ViewportSample } from '@/widgets/dev-probe'

const ROWS: [keyof ViewportSample, string][] = [
  ['layoutHeight', 'layout viewport h'],
  ['layoutWidth', 'layout viewport w'],
  ['vvHeight', 'visualViewport h'],
  ['vvOffsetTop', 'visualViewport top'],
  ['appHeight', '--app-height'],
  ['kbInset', '--kb-inset'],
  ['vvTop', '--vv-top'],
  ['panComp', '--pan-comp (live)'],
  ['panPad', '--pan-pad (settled)'],
  ['scrollTop', 'scroll body scrollTop'],
  ['htmlRectTop', 'html rect top'],
  ['rootRectTop', '#root rect top'],
  ['fixedRectTop', 'fixed box top'],
  ['visibleBottom', 'reveal band max'],
  ['headerTop', 'header top'],
  ['headerBottom', 'header bottom'],
  ['footerTop', 'footer top'],
  ['focused', 'focused element'],
  ['focusedTop', 'focused top'],
  ['focusedBottom', 'focused bottom'],
  ['stored', 'remembered kb'],
]

export function ViewportReadout({
  sample,
  className,
}: {
  sample: ViewportSample
  className?: string
}) {
  const sum = sample.vvOffsetTop + sample.vvHeight + parseInt(sample.kbInset || '0', 10)
  const anchored = parseInt(sample.appHeight || '0', 10)

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-(length:--p-text-tiny) tabular-nums',
        className,
      )}
    >
      {ROWS.map(([key, label]) => (
        <div key={key} className="contents">
          <dt className="truncate text-muted-foreground">{label}</dt>
          <dd className="truncate text-heading">{String(sample[key])}</dd>
        </div>
      ))}
      <dt className="truncate text-muted-foreground">top+vv+kb</dt>
      <dd className={sum === anchored ? 'text-heading' : 'text-(--danger-on-surface)'}>
        {sum} {sum === anchored ? '= anchored' : `≠ ${anchored}`}
      </dd>
    </dl>
  )
}
