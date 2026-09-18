import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn, EASE_OUT } from '@/shared/lib'
import { Button, FOCUS_RING } from '@/shared/ui'
import { useBibleT } from '../../i18n/use-bible-t'
import type { LibraryIndex } from '../../model/library-index'
import { formatRef } from '../../model/reference'
import type { PassagePicker } from '../../model/use-passage-picker'

export interface PassageGridProps {
  picker: PassagePicker
  index: LibraryIndex
}

type TileState = 'idle' | 'selected' | 'inRange'

const TILE: Record<TileState, string> = {
  idle: 'bg-card border border-border text-heading hover:bg-info-surface',
  selected: 'bg-primary text-primary-foreground shadow-interactive',
  inRange: 'bg-info-surface text-heading',
}

function NumberTile({
  value,
  state,
  held,
  onPick,
  label,
}: {
  value: number
  state: TileState
  held: boolean
  onPick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={state !== 'idle'}
      aria-label={label}
      className={cn(
        'relative grid aspect-square min-h-11 place-items-center rounded-control',
        'text-body font-semibold tabular-nums',
        'transition-[transform,background-color] duration-150 ease-out active:scale-[0.94]',
        TILE[state],
        FOCUS_RING,
        'motion-reduce:transition-none',
      )}
    >
      {value}
      {held ? (
        <span
          aria-hidden
          className={cn(
            'absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full',
            state === 'selected' ? 'bg-primary-foreground' : 'bg-primary',
          )}
        />
      ) : null}
    </button>
  )
}

const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2'

/**
 * Chapter and verses on one step, the way a printed Bible's reader moves: pick the chapter and its
 * verses open beneath it; tap the first verse, then the last. A dot marks what the Bible library
 * already holds, so a learner sees before choosing whether the text will fill itself in.
 */
export function PassageGrid({ picker, index }: PassageGridProps) {
  const t = useBibleT()
  const reduce = useReducedMotion()
  const verses = useRef<HTMLElement>(null)
  const { book, chapter, from, to } = picker

  // A newly picked chapter opens its verses below the fold on a phone: bring them up.
  useEffect(() => {
    if (!chapter) return
    verses.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
  }, [chapter, reduce])

  if (!book) return null

  const verseState = (verse: number): TileState => {
    if (verse === from || verse === to) return 'selected'
    return from && to && verse > from && verse < to ? 'inRange' : 'idle'
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="bible-chapter">
        <h2 id="bible-chapter" className="mb-2 text-label font-semibold text-muted-foreground">
          {t('chapter')}
        </h2>
        <div className={GRID}>
          {picker.chapterOptions.map((value) => (
            <NumberTile
              key={value}
              value={value}
              state={value === chapter ? 'selected' : 'idle'}
              held={index.hasChapter(book, value)}
              label={t('chapterLabel', { chapter: value })}
              onPick={() => picker.pickChapter(value)}
            />
          ))}
        </div>
      </section>

      {chapter ? (
        <motion.section
          ref={verses}
          key={chapter}
          aria-labelledby="bible-verses"
          className="scroll-mt-4"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          <h2 id="bible-verses" className="text-label font-semibold text-muted-foreground">
            {t('verses')}
          </h2>
          <p className="mb-2 text-label text-muted-foreground">{t('versesHint')}</p>
          <div className={GRID}>
            {picker.verseOptions.map((value) => (
              <NumberTile
                key={value}
                value={value}
                state={verseState(value)}
                held={index.hasVerse(book, chapter, value)}
                label={t('verseLabel', { verse: value })}
                onPick={() => picker.tapVerse(value)}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {from && !to ? (
              <Button variant="secondary" onClick={picker.justFrom}>
                {t('justVerse', { verse: from })}
              </Button>
            ) : null}
            <Button disabled={!from || !to} onClick={picker.confirm}>
              {from && to
                ? t('usePassage', { ref: formatRef({ book, chapter, from, to }) })
                : t('pickVerses')}
            </Button>
          </div>
        </motion.section>
      ) : null}
    </div>
  )
}
