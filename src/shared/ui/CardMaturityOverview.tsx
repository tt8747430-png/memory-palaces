import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib'

export interface CardMaturityOverviewProps {
  total: number
  counts: { new: number; learning: number; known: number }
}

const ORDER: Array<'new' | 'learning' | 'known'> = ['new', 'learning', 'known']
const FILL: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-(--divider)',
  learning: 'bg-secondary',
  known: 'bg-success',
}
const DOT: Record<'new' | 'learning' | 'known', string> = {
  new: 'bg-faint',
  learning: 'bg-secondary',
  known: 'bg-success',
}

export function CardMaturityOverview({ total, counts }: CardMaturityOverviewProps) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2.5 text-title font-bold tracking-tight text-heading">
        {t('study.cardsInDeck', { count: total })}
      </p>
      {total > 0 ? (
        // Width, and deliberately: the segments are siblings in a flex row whose widths sum to
        // 100%, so each one moving has to move the next — a transform leaves them overlapping.
        // §9's rule is about bars that move under the finger; this one changes only when the
        // deck's card counts do, at most a few segments, off the interaction path.
        <div className="flex h-2 overflow-hidden rounded-full bg-(--divider)" aria-hidden>
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
          <li key={k} className="inline-flex items-center gap-1.5 text-label text-muted-foreground">
            <span className={cn('size-2 rounded-full', DOT[k])} aria-hidden />
            {t(`srs.${k}`)}
            <span className="font-semibold text-heading">{counts[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
