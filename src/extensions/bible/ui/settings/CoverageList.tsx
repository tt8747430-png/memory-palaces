import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button, Progress, SettingsSection } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import { bookName } from '../../model/book-names'
import type { BookCode, Testament } from '../../model/canon'
import type { BookCoverage } from '../../model/coverage'

export interface CoverageListProps {
  coverage: readonly BookCoverage[]
  /** Offers Forget on each held book — dev mode only, and the caller decides that. */
  onForget?: (book: BookCode) => void
}

const TESTAMENTS: readonly { testament: Testament; key: 'oldTestament' | 'newTestament' }[] = [
  { testament: 'old', key: 'oldTestament' },
  { testament: 'new', key: 'newTestament' },
]

/**
 * What the Bible library holds, book by book. Books with nothing are folded away behind one
 * button, so a learner who has published three letters sees three rows, not sixty-six.
 */
export function CoverageList({ coverage, onForget }: CoverageListProps) {
  const t = useBibleT()
  const { t: core } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const hidden = coverage.filter((book) => book.verses === 0).length

  return (
    <div className="flex flex-col gap-5">
      {TESTAMENTS.map(({ testament, key }) => {
        const rows = coverage.filter(
          (book) => book.testament === testament && (showAll || book.verses > 0),
        )
        if (!rows.length) return null
        return (
          <SettingsSection key={testament} title={t(key)}>
            {rows.map((book) => (
              <div key={book.book} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-body font-semibold text-heading">
                      {bookName(book.book)}
                    </span>
                    <span className="shrink-0 text-label tabular-nums text-muted-foreground">
                      {t('coverage', {
                        chapters: book.chapters,
                        total: book.chaptersInBook,
                        count: book.verses,
                      })}
                    </span>
                  </span>
                  <Progress
                    value={(book.chapters / book.chaptersInBook) * 100}
                    className="mt-2 h-1"
                  />
                </span>
                {onForget && book.verses > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${bookName(book.book)} — ${core('common.delete')}`}
                    onClick={() => onForget(book.book)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            ))}
          </SettingsSection>
        )
      })}
      {hidden > 0 ? (
        <Button variant="secondary" className="self-center" onClick={() => setShowAll((on) => !on)}>
          {showAll ? t('hideEmptyBooks') : t('showAllBooks', { count: hidden })}
        </Button>
      ) : null}
    </div>
  )
}
