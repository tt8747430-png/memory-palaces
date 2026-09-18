import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { FOCUS_RING } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import { bookName } from '../../model/book-names'
import type { PassagePicker } from '../../model/use-passage-picker'

const SEGMENT = cn(
  'min-h-11 rounded-control px-2 text-body font-semibold text-primary',
  'transition-colors duration-150 ease-out hover:bg-info-surface',
  FOCUS_RING,
  'motion-reduce:transition-none',
)

/**
 * Where the learner is, and the way back to the books. It replaces "Start over", which was on
 * screen before there was anything to start over. A confirmed passage is summarised by the page
 * instead, with its own Change.
 */
export function PickerBreadcrumb({ picker }: { picker: PassagePicker }) {
  const t = useBibleT()
  const { book, chapter, from, to } = picker
  if (!book) return null
  const range = from && to ? (to > from ? `${from}–${to}` : String(from)) : null

  return (
    <nav aria-label={t('passageNav')}>
      <ol className="flex flex-wrap items-center gap-0.5">
        <li>
          <button type="button" className={SEGMENT} onClick={picker.toBooks}>
            {bookName(book)}
          </button>
        </li>
        {chapter ? (
          <li className="flex items-center gap-0.5">
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            <span aria-current="step" className="px-2 text-body font-semibold text-heading">
              {range ? `${chapter}:${range}` : chapter}
            </span>
          </li>
        ) : null}
      </ol>
    </nav>
  )
}
