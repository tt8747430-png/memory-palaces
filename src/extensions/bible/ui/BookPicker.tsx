import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib'
import { FOCUS_RING, Input } from '@/shared/ui'
import { BOOKS } from '../model/canon'
import { useBibleT } from '../i18n/use-bible-t'

export interface BookPickerProps {
  onPick: (book: string) => void
  /** Whether a book can be picked; the rest are shown disabled. */
  isPickable: (book: string) => boolean
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
    const needle = query.trim().toLowerCase()
    return needle ? BOOKS.filter((book) => book.name.toLowerCase().includes(needle)) : BOOKS
  }, [query])
  // Said only when it is true: with every book open, a line about greyed-out books describes nothing.
  const someDisabled = useMemo(() => BOOKS.some((book) => !isPickable(book.name)), [isPickable])

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
          <li key={book.name}>
            <button
              type="button"
              disabled={!isPickable(book.name)}
              onClick={() => onPick(book.name)}
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
              <span className="truncate">{book.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
