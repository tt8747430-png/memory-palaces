import { cn } from '@/shared/lib'
import { FOCUS_RING } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import { bookName } from '../../model/book-names'
import type { RecentPassage } from '../../model/recents'

export interface RecentChipsProps {
  recents: readonly RecentPassage[]
  onPick: (recent: RecentPassage) => void
}

/** The chapters the learner last added from, one tap back into each. Nothing yet, nothing shown. */
export function RecentChips({ recents, onPick }: RecentChipsProps) {
  const t = useBibleT()
  if (!recents.length) return null
  return (
    <section aria-labelledby="bible-recent">
      <h2 id="bible-recent" className="mb-2 text-label font-semibold text-muted-foreground">
        {t('recent')}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {recents.map((recent) => (
          <li key={`${recent.book}:${recent.chapter}`}>
            <button
              type="button"
              onClick={() => onPick(recent)}
              className={cn(
                'min-h-11 rounded-full border border-border bg-card px-4 text-body font-semibold text-heading',
                'shadow-rest transition-[transform,background-color] duration-150 ease-out',
                'hover:bg-info-surface active:scale-[0.97]',
                FOCUS_RING,
                'motion-reduce:transition-none',
              )}
            >
              {bookName(recent.book)} {recent.chapter}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
