import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib'
import { FOCUS_RING } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import { bookAbbreviation, bookName } from '../../model/book-names'
import { BOOKS, type BookCode, TESTAMENTS } from '../../model/canon'
import type { LibraryIndex } from '../../model/library-index'
import { TESTAMENT_TITLE } from '../testament-title'
import { GENRE_SWATCH } from './genre-swatch'

export interface BookGridProps {
  index: LibraryIndex
  onPick: (book: BookCode) => void
}

/**
 * All sixty-six books on one screen: six abbreviation tiles to a row, each shelf tinted its own
 * colour. Every tile keeps a 44px target (MOBILE_DESIGN §3). No book is ever disabled — a book the
 * Bible library holds nothing for is where pasting fills it — but the ones it does hold carry a dot.
 */
export function BookGrid({ index, onPick }: BookGridProps) {
  const t = useBibleT()
  return (
    <div className="flex flex-col gap-5">
      {TESTAMENTS.map((testament) => (
        <section key={testament} aria-labelledby={`bible-${testament}`}>
          <h2
            id={`bible-${testament}`}
            className="mb-2 text-label font-semibold text-muted-foreground"
          >
            {t(TESTAMENT_TITLE[testament])}
          </h2>
          <ul className="grid grid-cols-6 gap-1.5">
            {BOOKS.filter((book) => book.testament === testament).map((book) => {
              const held = index.hasBook(book.code)
              return (
                <li key={book.code}>
                  <button
                    type="button"
                    onClick={() => onPick(book.code)}
                    style={{ '--sw': GENRE_SWATCH[book.genre] } as CSSProperties}
                    className={cn(
                      'sw-tint relative grid min-h-11 w-full place-items-center rounded-control px-0.5',
                      'text-label font-semibold',
                      'transition-transform duration-150 ease-out active:scale-[0.94]',
                      FOCUS_RING,
                      'motion-reduce:transition-none',
                    )}
                  >
                    <span aria-hidden className="truncate">
                      {bookAbbreviation(book.code)}
                    </span>
                    <span className="sr-only">
                      {held ? `${bookName(book.code)}, ${t('hasText')}` : bookName(book.code)}
                    </span>
                    {held ? (
                      <span
                        aria-hidden
                        className="absolute right-1 top-1 size-1.5 rounded-full bg-current opacity-70"
                      />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
