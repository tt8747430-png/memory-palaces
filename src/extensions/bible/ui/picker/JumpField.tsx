import { type FormEvent, useRef, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Button, FOCUS_RING, Input } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import { bookName } from '../../model/book-names'
import { parseJump } from '../../model/jump'
import { formatPartial, type PartialVerseRef } from '../../model/reference'

export interface JumpFieldProps {
  onJump: (target: PartialVerseRef) => void
}

const EMPTY = { chapter: null, from: null, to: null }

/**
 * The fast way in: `ioan 3 16-18` goes straight to the passage. While only a name is typed it
 * offers the books that name could mean. Never focused on mount — the grid below is what most
 * learners came for, and a raised keyboard would cover it (CODE_STYLE §11).
 */
export function JumpField({ onJump }: JumpFieldProps) {
  const t = useBibleT()
  const [query, setQuery] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const { books, target } = parseJump(query)

  const go = (next: PartialVerseRef) => {
    setQuery('')
    onJump(next)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target) return
    // The passage is what the learner wants to see now; the keyboard would cover it.
    field.current?.blur()
    go(target)
  }

  return (
    <form role="search" onSubmit={submit} className="flex flex-col gap-2">
      <span className="relative block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={field}
          type="search"
          value={query}
          aria-label={t('jumpLabel')}
          placeholder={t('jumpPlaceholder')}
          enterKeyHint="go"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="pl-10"
          onChange={(event) => setQuery(event.target.value)}
        />
      </span>
      {target?.chapter ? (
        <Button type="submit" variant="secondary" className="self-start">
          {t('goTo', { ref: formatPartial(target) })}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      ) : query.trim() && books.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t('jumpMatches')}>
          {books.map((book) => (
            <li key={book}>
              <button
                type="button"
                onClick={() => go({ book, ...EMPTY })}
                className={cn(
                  'min-h-11 rounded-full bg-secondary/40 px-4 text-body font-semibold text-heading',
                  'transition-colors duration-150 ease-out hover:bg-secondary/70',
                  FOCUS_RING,
                  'motion-reduce:transition-none',
                )}
              >
                {bookName(book)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
