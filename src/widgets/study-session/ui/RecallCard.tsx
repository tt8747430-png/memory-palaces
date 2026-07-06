import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Flag, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import {
  cn,
  isReferenceMarker,
  recallAnswer,
  scramble,
  tokenizeWords,
  typedRecallStatus,
  wordInitial,
} from '@/shared/lib'
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
  /** Type mode reports its textarea focus so the panel can free up room for the keyboard. */
  onInputFocusChange?: (focused: boolean) => void
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
  onInputFocusChange,
}: RecallCardProps) {
  const { t } = useTranslation()
  const [peekTip, setPeekTip] = useState(false)

  const locus = card.locus
  const prompt = direction === 'front' ? locus.front : locus.back
  // Strip a leading reference the answer repeats from the prompt, so a recall mode never asks
  // the user to reproduce the very prompt they're looking at.
  const answer = useMemo(
    () => recallAnswer(prompt, direction === 'front' ? locus.back : locus.front),
    [prompt, direction, locus.back, locus.front],
  )

  useEffect(() => setPeekTip(false), [locus.id])

  return (
    <div className="flex h-full w-full max-w-md flex-col rounded-card-featured bg-card-glass p-5 shadow-elevated">
      <header className="flex h-7 shrink-0 items-center justify-end gap-1.5">
        {locus.flagged ? (
          <Flag className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]" aria-hidden />
        ) : null}
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
      </header>

      <div className="shrink-0 pt-1 text-center">
        <h2 className="text-balance break-words text-[clamp(19px,5vw,23px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {locus.tip ? (
          <div className="mt-2 flex min-h-[32px] items-center justify-center">
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
              {mode === 'type' ? (
                <TypeMode answer={answer} onSolved={onReveal} onFocusChange={onInputFocusChange} />
              ) : null}
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

/** The centered-scroll shell every recall mode shares: content sits centered when it's short and
 * scrolls (top-aligned growth) when it's a long verse — the `min-h-full` inner is what keeps a
 * tall block from spilling out of a fixed `flex-1` box and overlapping the prompt above it. */
function ModeScroll({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide" onClick={onClick}>
      <div className="flex min-h-full flex-col justify-center gap-4 py-1">{children}</div>
    </div>
  )
}

function RevealedAnswer({ answer, hint }: { answer: string; hint?: string }) {
  const { t } = useTranslation()
  return (
    <ModeScroll>
      <p className="allow-select text-balance break-words text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {hint ? (
        <div className="w-full rounded-card bg-secondary/20 p-4 text-left">
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
    </ModeScroll>
  )
}

function TypeMode({
  answer,
  onSolved,
  onFocusChange,
}: {
  answer: string
  onSolved: () => void
  onFocusChange?: (focused: boolean) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const result = typedRecallStatus(answer, value)
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0

  useEffect(() => {
    if (result.complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.complete])

  // Blur reports false even when the field is torn down on card change, so the panel's own
  // per-card reset is the backstop.
  useEffect(() => () => onFocusChange?.(false), [onFocusChange])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder={t('study.typePlaceholder')}
        aria-label={t('study.typePlaceholder')}
        className="min-h-[88px] w-full flex-1 resize-none rounded-card border border-border bg-card px-4 py-3 text-[length:var(--p-text-body)] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />

      <div className="shrink-0 rounded-card bg-info-surface px-4 py-3">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            />
          </div>
          <span className="shrink-0 text-[length:var(--p-text-label)] font-bold tabular-nums text-heading">
            {result.correct} / {result.total}
          </span>
        </div>
        {result.complete ? (
          <p className="inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-[var(--success-foreground)]">
            <Sparkles className="size-4" aria-hidden />
            {t('study.wordPerfect')}
          </p>
        ) : result.typed.length === 0 ? (
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
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const [peek, setPeek] = useState<number | null>(null)

  return (
    <ModeScroll onClick={() => setPeek(null)}>
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
                'whitespace-nowrap rounded-control px-1 transition-colors',
                open ? 'bg-primary/12 text-heading' : 'active:bg-primary/5',
              )}
            >
              {open ? (
                token
              ) : (
                <>
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
                </>
              )}
            </button>
          )
        })}
      </p>
    </ModeScroll>
  )
}

function BlurMode({ answer, onSolved }: { answer: string; onSolved: () => void }) {
  const { t } = useTranslation()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
  // Every hideable word starts blurred; tapping one clears it. Recall the answer, then tap the
  // words you got right — clear them all and the card auto-reveals to grade.
  const [shown, setShown] = useState<Set<number>>(() => new Set())
  const allShown = hideable.length > 0 && hideable.every((i) => shown.has(i))

  useEffect(() => {
    if (allShown) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allShown])

  return (
    <ModeScroll>
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
              >
                {token}
              </span>
            </button>
          )
        })}
      </p>
      {!allShown ? (
        <p className="text-center text-[length:var(--p-text-label)] text-muted-foreground">
          {t('study.blurHint')}
        </p>
      ) : null}
    </ModeScroll>
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
  // Track consumed chips by key, not by position, so two identical words (e.g. "în" … "în") are
  // interchangeable — tapping either satisfies the next slot as long as the word matches.
  const [usedKeys, setUsedKeys] = useState<Set<string>>(() => new Set())
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const placed = usedKeys.size
  const done = words.length > 0 && placed >= words.length

  useEffect(() => {
    if (done) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const tapChip = (chip: WordChip) => {
    if (usedKeys.has(chip.key)) return
    if (chip.word === words[placed]) {
      setUsedKeys((prev) => new Set(prev).add(chip.key))
      setWrongKey(null)
    } else {
      setWrongKey(chip.key)
      window.setTimeout(() => setWrongKey((k) => (k === chip.key ? null : k)), 450)
    }
  }

  return (
    <ModeScroll>
      <p className="min-h-[32px] text-balance text-center text-[clamp(16px,4.4vw,20px)] font-semibold leading-relaxed text-heading">
        {placed === 0 ? (
          <span className="text-[length:var(--p-text-body)] font-medium text-muted-foreground">
            {t('study.rebuildHint')}
          </span>
        ) : (
          words.slice(0, placed).join(' ')
        )}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {chips.map((chip) => {
          const used = usedKeys.has(chip.key)
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
            setUsedKeys(new Set())
            setWrongKey(null)
          }}
          className="mx-auto inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {t('study.startOver')}
        </button>
      ) : null}
      {done ? (
        <p className="inline-flex items-center justify-center gap-1.5 text-[length:var(--p-text-sub)] font-semibold text-[var(--success-foreground)]">
          <Sparkles className="size-4" aria-hidden />
          {t('study.rebuilt')}
        </p>
      ) : null}
    </ModeScroll>
  )
}
