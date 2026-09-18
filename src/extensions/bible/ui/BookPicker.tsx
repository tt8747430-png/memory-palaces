import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Input } from '@/shared/ui'
import { BOOKS } from '../model/canon'
import { useBibleT } from '../i18n/use-bible-t'

/**
 * The filter field never mounts focused: this is content, not chrome a learner asked to raise, and
 * an autofocus here would open the keyboard over the list they came to read (CODE_STYLE §11).
 */
export function BookPicker({ onPick }: { onPick: (book: string) => void }) {
  const t = useBibleT()
  const [query, setQuery] = useState('')
  const books = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? BOOKS.filter((book) => book.name.toLowerCase().includes(needle)) : BOOKS
  }, [query])

  return (
    <section>
      <h2 className="mb-3 text-body font-bold text-heading">{t('pickBook')}</h2>
      <span className="relative block">
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
      <ul className="mt-3 flex flex-col gap-2">
        {books.map((book) => (
          <li key={book.name}>
            <button
              type="button"
              onClick={() => onPick(book.name)}
              className={cn(
                'w-full rounded-control bg-secondary/40 px-4 py-3 text-left text-body font-semibold text-heading',
                'transition-[transform,background-color] duration-150 ease-out',
                'hover:bg-secondary/70 active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
                'motion-reduce:transition-none',
              )}
            >
              {book.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
