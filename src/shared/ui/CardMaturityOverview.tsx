import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

export interface CardMaturityOverviewProps {
  /** Total cards in the set. */
  total: number
  counts: { new: number; learning: number; known: number }
  /** Heading copy variant. */
  scope: 'room' | 'palace'
}

const ORDER: Array<'new' | 'learning' | 'known'> = ['new', 'learning', 'known']
const FILL: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-[var(--divider)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}
const DOT: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-[var(--text-faint)]',
  learning: 'bg-secondary',
  known: 'bg-success',
}

/** Whole-set maturity overview: "Cards in this room (N)" + a New/Learning/Known bar and
 * legend. Reads no stores — counts are passed in. */
export function CardMaturityOverview({ total, counts, scope }: CardMaturityOverviewProps) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2.5 text-[length:var(--p-text-title)] font-bold tracking-tight text-heading">
        {t(scope === 'palace' ? 'study.cardsInPalace' : 'study.cardsInRoom', { count: total })}
      </p>
      {total > 0 ? (
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--divider)]" aria-hidden>
          {ORDER.filter((k) => counts[k] > 0).map((k) => (
            <span
              key={k}
              className={cn('h-full transition-[width] duration-500 ease-out', FILL[k])}
              style={{ width: `${(counts[k] / total) * 100}%` }}
            />
          ))}
        </div>
      ) : null}
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {ORDER.map((k) => (
          <li
            key={k}
            className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] text-muted-foreground"
          >
            <span className={cn('size-2 rounded-full', DOT[k])} aria-hidden />
            {t(`srs.${k}`)}
            <span className="font-semibold text-heading">{counts[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
