import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib'
import { FOCUS_RING, Input } from '@/shared/ui'
import { BOOKS, type BookCode } from '../model/canon'
import { bookName, normalizeBookText } from '../model/book-names'
import { useBibleT } from '../i18n/use-bible-t'

export interface BookPickerProps {
  onPick: (book: BookCode) => void
  /** Whether a book can be picked; the rest are shown disabled. */
  isPickable: (book: BookCode) => boolean
}

/**
 * Two columns of 44px rows, not one of taller ones: sixty-six books fit on a phone in half the
 * scroll, and every row keeps a full touch target (MOBILE_DESIGN §3).
 *
 * The filter field never mounts focused: this is content, not chrome a learner asked to raise, and
 * an autofocus here would open the keyboard over the list they came to read (CODE_STYLE §11).
 */
export function BookPicker({ onPick, isPickable }: BookPickerProps) {
  const t = useBibleT()
  const [query, setQuery] = useState('')
  const books = useMemo(() => {
    const needle = normalizeBookText(query)
    return needle
      ? BOOKS.filter((book) => normalizeBookText(bookName(book.code)).includes(needle))
      : BOOKS
  }, [query])
  // Said only when it is true: with every book open, a line about greyed-out books describes nothing.
  const someDisabled = useMemo(() => BOOKS.some((book) => !isPickable(book.code)), [isPickable])

  return (
    <section>
      <h2 className="text-body font-bold text-heading">{t('pickBook')}</h2>
      {someDisabled ? (
        <p className="mt-0.5 text-label leading-snug text-muted-foreground">
          {t('booksWithoutText')}
        </p>
      ) : null}
      <span className="relative mt-3 block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          aria-label={t('searchBooks')}
          placeholder={t('searchBooks')}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-10"
        />
      </span>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {books.map((book) => (
          <li key={book.code}>
            <button
              type="button"
              disabled={!isPickable(book.code)}
              onClick={() => onPick(book.code)}
              className={cn(
                'flex min-h-11 w-full items-center rounded-control bg-secondary/40 px-3 text-left',
                'text-body font-semibold text-heading',
                'transition-[transform,background-color] duration-150 ease-out',
                'hover:bg-secondary/70 active:scale-[0.98]',
                'disabled:pointer-events-none disabled:text-muted-foreground disabled:opacity-45',
                FOCUS_RING,
                'motion-reduce:transition-none',
              )}
            >
              <span className="truncate">{bookName(book.code)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
