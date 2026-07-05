import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flag, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import {
  cn,
  isReferenceMarker,
  scramble,
  tokenizeWords,
  typedRecallStatus,
  wordInitial,
} from '@/shared/lib'
import { Chip, SrsStatusChip } from '@/shared/ui'
import type { StudyCard, StudyDirection } from '../model/types'

export interface RecallCardProps {
  card: StudyCard
  /** Which recall mode drives the answer area. `flip` is handled by `StudyCardDeck`, not here. */
  mode: Exclude<StudyMode, 'flip'>
  direction: StudyDirection
  /** Mark blanks for each hidden letter in Initials mode. */
  wordSpaces: boolean
  /** True once the answer is shown — the panel swaps its footer to the grade buttons. */
  revealed: boolean
  canSpeak: boolean
  /** Reveal the answer (idempotent). Fired by the footer button and on a solved attempt. */
  onReveal: () => void
  onSpeak: (text: string) => void
}

/** The non-flip study surface: the prompt stays visible while the answer is recalled through
 * one of the recall modes (Type / Initials / Blur / Rebuild). Completing an attempt — or the
 * panel's "Show answer" — reveals the full answer, at which point the panel grades the card
 * through the same SRS control as flip mode. Keyed per card by the panel, so each mode's
 * attempt state resets on the next card. */
export function RecallCard({
  card,
  mode,
  direction,
  wordSpaces,
  revealed,
  canSpeak,
  onReveal,
  onSpeak,
}: RecallCardProps) {
  const { t } = useTranslation()
  const [peekTip, setPeekTip] = useState(false)

  const locus = card.locus
  const prompt = direction === 'front' ? locus.front : locus.back
  const answer = direction === 'front' ? locus.back : locus.front

  useEffect(() => setPeekTip(false), [locus.id])

  return (
    <div className="flex h-full w-full max-w-md flex-col rounded-card-featured bg-card-glass p-6 shadow-elevated">
      <header className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Chip icon={<MapPin className="size-3" aria-hidden />}>
            {direction === 'front' ? t('study.recall') : t('study.term')}
          </Chip>
          <SrsStatusChip srs={locus.srs} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canSpeak ? (
            <button
              type="button"
              onClick={() => onSpeak(revealed ? answer : prompt)}
              aria-label={t('study.readAloud')}
              className="grid size-7 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-90"
            >
              <Volume2 className="size-3.5" aria-hidden />
            </button>
          ) : null}
          {locus.flagged ? (
            <Flag className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]" aria-hidden />
          ) : null}
        </div>
      </header>

      <div className="shrink-0 pt-3 text-center">
        <h2 className="text-balance break-words text-[clamp(20px,5.4vw,26px)] font-bold leading-tight text-heading">
          {prompt}
        </h2>
        {locus.tip ? (
          <div className="mt-2 flex min-h-[36px] items-center justify-center">
            {peekTip ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[36ch] text-[length:var(--p-text-label)] italic text-muted-foreground"
              >
                {locus.tip}
              </motion.p>
            ) : (
              <button
                type="button"
                onClick={() => setPeekTip(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--p-text-label)] font-semibold text-[var(--warning-foreground)]"
              >
                <Lightbulb className="size-3.5" aria-hidden />
                {t('study.peekHint')}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="my-3 h-px shrink-0 bg-border" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <RevealedAnswer answer={answer} hint={locus.hint} />
            </motion.div>
          ) : (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {mode === 'type' ? <TypeMode answer={answer} onSolved={onReveal} /> : null}
              {mode === 'initials' ? (
                <InitialsMode answer={answer} wordSpaces={wordSpaces} />
              ) : null}
              {mode === 'blur' ? <BlurMode answer={answer} onSolved={onReveal} /> : null}
              {mode === 'words' ? <RebuildMode answer={answer} onSolved={onReveal} /> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const SCROLL = 'min-h-0 flex-1 overflow-y-auto scrollbar-hide'

function RevealedAnswer({ answer, hint }: { answer: string; hint?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn(SCROLL, 'flex flex-col items-center justify-center text-center')}>
      <p className="allow-select text-balance break-words text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {hint ? (
        <div className="mt-5 w-full rounded-card bg-secondary/20 p-4 text-left">
          <div className="mb-1.5 flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-heading" aria-hidden />
            <p className="text-[length:var(--p-text-label)] font-semibold text-heading">
              {t('study.whereToPicture')}
            </p>
          </div>
          <p className="text-[length:var(--p-text-label)] italic leading-relaxed text-muted-foreground">
            {hint}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function TypeMode({ answer, onSolved }: { answer: string; onSolved: () => void }) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const result = typedRecallStatus(answer, value)

  useEffect(() => {
    if (result.complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.complete])

  return (
    <div className={cn(SCROLL, 'space-y-3')}>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('study.typePlaceholder')}
        rows={3}
        aria-label={t('study.typePlaceholder')}
        className="w-full resize-none rounded-card border border-border bg-card px-4 py-3 text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      />

      <div className="rounded-card bg-info-surface px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[length:var(--p-text-tiny)] font-bold uppercase tracking-wide text-muted-foreground">
            {t('study.feedback')}
          </p>
          <span className="text-[length:var(--p-text-label)] font-bold tabular-nums text-heading">
            {result.correct} / {result.total}
          </span>
        </div>
        {result.typed.length === 0 ? (
          <p className="text-[length:var(--p-text-label)] text-muted-foreground">
            {t('study.typeFeedbackHint')}
          </p>
        ) : (
          <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-[length:var(--p-text-body)] font-medium leading-relaxed">
            {result.typed.map((word, i) => (
              <span
                key={i}
                className={
                  result.statuses[i] === 'correct'
                    ? 'text-[var(--success-foreground)]'
                    : 'text-[var(--danger-on-surface)] line-through'
                }
              >
                {word}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  )
}

function InitialsMode({ answer, wordSpaces }: { answer: string; wordSpaces: boolean }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const [peek, setPeek] = useState<number | null>(null)

  return (
    <div className={SCROLL} onClick={() => setPeek(null)}>
      <div className="flex min-h-full items-center justify-center py-2">
        <p
          className={cn(
            'flex w-full flex-wrap items-baseline justify-center gap-y-2.5 text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
            wordSpaces ? 'gap-x-3' : 'gap-x-2',
          )}
        >
          {tokens.map((token, i) => {
            if (isReferenceMarker(token)) {
              return (
                <span key={i} className="font-bold text-accent">
                  {token}
                </span>
              )
            }
            const { lead, initial, hidden, trail } = wordInitial(token)
            const open = peek === i
            return (
              <button
                key={i}
                type="button"
                aria-label={t('study.revealWord', { word: token })}
                onClick={(event) => {
                  event.stopPropagation()
                  setPeek((current) => (current === i ? null : i))
                }}
                className={cn(
                  'relative -mx-0.5 whitespace-nowrap rounded-control px-0.5 transition-colors',
                  open ? 'bg-primary/10' : 'active:bg-primary/5',
                )}
              >
                {lead}
                <span className="font-bold">{initial}</span>
                {wordSpaces && hidden > 0 ? (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block border-b-2 border-[color-mix(in_oklch,var(--primary)_40%,transparent)] align-baseline"
                    style={{ width: `${Math.min(Math.max(hidden, 1), 16)}ch` }}
                  />
                ) : null}
                {trail}
                <AnimatePresence>
                  {open ? (
                    <motion.span
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                      className="absolute bottom-full left-1/2 z-20 mb-1.5 max-w-[70vw] -translate-x-1/2 rounded-control bg-primary px-2.5 py-1 text-[length:var(--p-text-label)] font-semibold text-primary-foreground shadow-elevated"
                    >
                      {token}
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-primary"
                      />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </button>
            )
          })}
        </p>
      </div>
    </div>
  )
}

function BlurMode({ answer, onSolved }: { answer: string; onSolved: () => void }) {
  const { t } = useTranslation()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
  // Every hideable word starts blurred; tapping one clears it. Recall the answer, then
  // tap the words you got right — clear them all and the card auto-reveals to grade.
  const [shown, setShown] = useState<Set<number>>(() => new Set())
  const allShown = hideable.length > 0 && hideable.every((i) => shown.has(i))

  useEffect(() => {
    if (allShown) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allShown])

  return (
    <div className={SCROLL}>
      <div className="flex min-h-full flex-col items-center justify-center gap-4 py-2">
        <p className="flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-2 text-[clamp(17px,4.6vw,22px)] font-semibold leading-relaxed text-heading">
          {tokens.map((token, i) => {
            if (isReferenceMarker(token)) {
              return (
                <span key={i} className="font-bold text-accent">
                  {token}
                </span>
              )
            }
            const blurred = !shown.has(i)
            return (
              <button
                key={i}
                type="button"
                aria-label={blurred ? t('study.revealWord', { word: '' }) : token}
                onClick={() => setShown((prev) => new Set(prev).add(i))}
                className="whitespace-nowrap rounded-control px-0.5 transition-transform active:scale-95"
              >
                <span
                  className={cn(
                    'inline-block transition-[filter,opacity] duration-300',
                    blurred && 'select-none opacity-70 blur-[6px]',
                  )}
                  style={
                    blurred
                      ? {
                          textShadow:
                            '0 0 10px color-mix(in oklch, var(--primary) 30%, transparent)',
                        }
                      : undefined
                  }
                >
                  {token}
                </span>
              </button>
            )
          })}
        </p>
        {!allShown ? (
          <p className="text-[length:var(--p-text-label)] text-muted-foreground">
            {t('study.blurHint')}
          </p>
        ) : null}
      </div>
    </div>
  )
}

interface WordChip {
  pos: number
  word: string
  key: string
}

function RebuildMode({ answer, onSolved }: { answer: string; onSolved: () => void }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const words = useMemo(() => tokenizeWords(answer), [answer])
  const chips = useMemo<WordChip[]>(
    () => scramble(words.map((word, pos) => ({ pos, word, key: `${pos}-${word}` }))),
    [words],
  )
  const [placed, setPlaced] = useState(0)
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const done = words.length > 0 && placed >= words.length

  useEffect(() => {
    if (done) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const tapChip = (chip: WordChip) => {
    if (chip.pos === placed) {
      setPlaced((p) => p + 1)
      setWrongKey(null)
    } else {
      setWrongKey(chip.key)
      window.setTimeout(() => setWrongKey((k) => (k === chip.key ? null : k)), 450)
    }
  }

  return (
    <div className={cn(SCROLL, 'flex flex-col')}>
      <p className="min-h-[40px] text-balance text-center text-[clamp(16px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {placed === 0 ? (
          <span className="text-[length:var(--p-text-body)] font-medium text-muted-foreground">
            {t('study.rebuildHint')}
          </span>
        ) : (
          words.slice(0, placed).join(' ')
        )}
      </p>

      <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {chips.map((chip) => {
            const used = chip.pos < placed
            const isWrong = wrongKey === chip.key
            return (
              <motion.button
                key={chip.key}
                type="button"
                disabled={used}
                onClick={() => !used && tapChip(chip)}
                animate={isWrong && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  'rounded-full px-3.5 py-2 text-[length:var(--p-text-sub)] font-semibold transition-colors',
                  used
                    ? 'bg-info-surface text-muted-foreground opacity-40'
                    : isWrong
                      ? 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)] ring-2 ring-[var(--danger)]'
                      : 'bg-secondary/20 text-heading',
                )}
              >
                {chip.word}
              </motion.button>
            )
          })}
        </div>
        {placed > 0 && !done ? (
          <button
            type="button"
            onClick={() => {
              setPlaced(0)
              setWrongKey(null)
            }}
            className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t('study.startOver')}
          </button>
        ) : null}
        {done ? (
          <p className="inline-flex items-center gap-1.5 text-[length:var(--p-text-sub)] font-semibold text-[var(--success-foreground)]">
            <Sparkles className="size-4" aria-hidden />
            {t('study.rebuilt')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
