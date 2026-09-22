import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { cn } from '@/shared/lib'
import { EmptyNotice } from '@/shared/ui'

export interface FilteredNoticeProps {
  shown: number
  hidden: number
  /**
   * How to reach the control that set the filter, from a list that is only being read. Left off
   * while the controls are already on screen — the arrange bar draws this too, and an affordance
   * pointing at something a thumb is already touching is noise.
   */
  onArrange?: () => void
}

const LINE = 'px-1 text-tiny font-semibold text-muted-foreground'

/**
 * What a filter is doing to this list, wherever the list is read. A filter is a setting now, so it
 * outlives the selection that set it — and a Library quietly missing half its decks, with the only
 * control for that behind a mode, is a Library that looks broken. This is the standing account of
 * it, and in browse mode it is also the way back to the control.
 */
export function FilteredNotice({ shown, hidden, onArrange }: FilteredNoticeProps) {
  const { t } = useTranslation()
  if (hidden <= 0) return null

  const counts = { shown, total: shown + hidden }

  return (
    <>
      {onArrange ? (
        <button
          type="button"
          onClick={onArrange}
          className={cn(
            LINE,
            'flex min-h-11 items-center gap-1.5 self-start rounded-control text-left',
            'transition-[transform,color] hover:text-heading active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40',
          )}
        >
          <ListFilter className="size-3.5 shrink-0 text-accent" aria-hidden />
          {t('deck.filterChange', counts)}
        </button>
      ) : (
        <p className={LINE} role="status">
          {t('deck.filterHidden', counts)}
        </p>
      )}

      {/* A filter that keeps nothing has to say so: an empty list beside a "0 of 8" would read as a
          Library that had lost its decks. This is also where an applied filter that has run out of
          rows lands — it stays on offer, and this says why the list is bare. */}
      {shown === 0 ? <EmptyNotice>{t('deck.filterEmpty')}</EmptyNotice> : null}
    </>
  )
}
