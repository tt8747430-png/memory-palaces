import { useTranslation } from 'react-i18next'
import { Check, IndentIncrease } from 'lucide-react'
import type { DeckSort } from '@/shared/lib'
import { cn } from '@/shared/lib'
import { SortControl, useDeckSortOptions } from '@/shared/ui'

export interface LibrarySortBarProps {
  sort: DeckSort
  onSortChange: (sort: DeckSort) => void
  subdecks: boolean
  onSubdecksChange: (on: boolean) => void
}

/**
 * How the Library is arranged, and how deep that reaches. The toggle only appears once an order
 * has been chosen: under the manual order there is nothing for it to reach, since every row is
 * already exactly where it was dragged.
 */
export function LibrarySortBar({
  sort,
  onSortChange,
  subdecks,
  onSubdecksChange,
}: LibrarySortBarProps) {
  const { t } = useTranslation()
  const options = useDeckSortOptions()

  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <SortControl
        label={t('deck.sortLabel')}
        value={sort}
        options={options}
        onChange={onSortChange}
      />

      {sort === 'manual' ? (
        <span aria-hidden />
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={subdecks}
          onClick={() => onSubdecksChange(!subdecks)}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-control px-2.5 text-label font-semibold',
            'transition-transform active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
            subdecks ? 'bg-info-surface text-heading' : 'text-muted-foreground',
          )}
        >
          {subdecks ? (
            <Check className="size-4 shrink-0" aria-hidden />
          ) : (
            <IndentIncrease className="size-4 shrink-0" aria-hidden />
          )}
          {t('deck.includeSubdecks')}
        </button>
      )}
    </div>
  )
}
