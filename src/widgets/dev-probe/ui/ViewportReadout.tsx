import { cn } from '@/shared/lib'
import {
  checkViewport,
  SAMPLE_ROWS,
  type ProbeCheck,
  type ViewportSample,
} from '../model/viewport-sample'

const STATE: Record<ProbeCheck['state'], string> = {
  ok: 'text-(--success-on-surface)',
  bad: 'text-(--danger-on-surface)',
  idle: 'text-muted-foreground',
}

const MARK: Record<ProbeCheck['state'], string> = { ok: '✓', bad: '✗', idle: '–' }

export function ViewportReadout({
  sample,
  className,
  rows = true,
}: {
  sample: ViewportSample
  className?: string
  /** The verdicts are the reading; the raw rows are the evidence, and the overlay hides them. */
  rows?: boolean
}) {
  const checks = checkViewport(sample)

  return (
    <div className={cn('font-mono text-(length:--p-text-tiny) tabular-nums', className)}>
      <ul className="flex flex-col gap-0.5">
        {checks.map((check) => (
          <li key={check.id} className={cn('flex gap-1.5', STATE[check.state])}>
            <span aria-hidden className="w-2 shrink-0 font-bold">
              {MARK[check.state]}
            </span>
            <span className="w-24 shrink-0 font-semibold">{check.label}</span>
            <span className="min-w-0 flex-1 break-words">{check.detail}</span>
          </li>
        ))}
      </ul>
      {rows ? (
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-2">
          {SAMPLE_ROWS.map(([key, label]) => (
            <div key={key} className="contents">
              <dt className="truncate text-muted-foreground">{label}</dt>
              <dd className="truncate text-heading">{String(sample[key])}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
