import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Flag, Lightbulb, MapPin, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import {
  cn,
  isReferenceMarker,
  normalizeInitial,
  normalizeWord,
  recallAnswer,
  scramble,
  tokenizeWords,
  typedRecallStatus,
  wordInitial,
} from '@/shared/lib'
import { SegmentedControl } from '@/shared/ui'
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
  /** The keyboard is up — compress the prompt block so the working area keeps its room. */
  compact: boolean
  /** Type mode's aid: type only each word's first letter instead of the full text. */
  typeInitialsOnly: boolean
  onTypeInitialsOnly: (value: boolean) => void
  /** Reveal the answer (idempotent). Fired by the footer button and on a solved attempt. */
  onReveal: () => void
  onSpeak: (text: string) => void
  /** Type mode reports its input focus so the panel can free up room for the keyboard. */
  onInputFocusChange?: (focused: boolean) => void
}

/** The non-flip study surface: the prompt stays visible while the answer is recalled through
 * one of the recall modes (Blur / Rebuild / Initials / Type). Completing an attempt — or the
 * panel's "Show answer" — reveals the full answer, at which point the panel grades the card
 * through the same SRS control as flip mode. Keyed per card by the panel, so each mode's
 * attempt state resets on the next card.
 *
 * Reveal presentation is per-mode: Initials and Blur reveal in place (the words simply fill
 * in, no layout swap), a solved Rebuild keeps its reconstructed text, and only Type — or an
 * abandoned Rebuild — swaps to the plain answer view. */
export function RecallCard({
  card,
  mode,
  direction,
  wordSpaces,
  revealed,
  canSpeak,
  compact,
  typeInitialsOnly,
  onTypeInitialsOnly,
  onReveal,
  onSpeak,
  onInputFocusChange,
}: RecallCardProps) {
  const { t } = useTranslation()
  const [peekTip, setPeekTip] = useState(false)
  const [solved, setSolved] = useState(false)

  const locus = card.locus
  const prompt = direction === 'front' ? locus.front : locus.back
  // Strip a leading reference the answer repeats from the prompt, so a recall mode never asks
  // the user to reproduce the very prompt they're looking at.
  const answer = useMemo(
    () => recallAnswer(prompt, direction === 'front' ? locus.back : locus.front),
    [prompt, direction, locus.back, locus.front],
  )

  const solve = () => {
    setSolved(true)
    onReveal()
  }

  const swapToAnswer = revealed && (mode === 'type' || (mode === 'words' && !solved))

  return (
    <div className="flex h-full w-full max-w-md flex-col rounded-card-featured bg-card-glass p-5 shadow-elevated">
      {!compact ? (
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
      ) : null}

      <div className="shrink-0 pt-1 text-center">
        <h2
          className={cn(
            'text-balance break-words font-bold leading-tight tracking-[-0.01em] text-heading',
            compact ? 'text-[length:var(--p-text-title)]' : 'text-[clamp(19px,5vw,23px)]',
          )}
        >
          {prompt}
        </h2>
        {locus.tip && !compact ? (
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

      <div className={cn('h-px shrink-0 bg-border', compact ? 'my-2' : 'my-3')} aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {swapToAnswer ? (
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
                <TypeMode
                  answer={answer}
                  initialsOnly={typeInitialsOnly}
                  onInitialsOnly={onTypeInitialsOnly}
                  onSolved={solve}
                  onFocusChange={onInputFocusChange}
                />
              ) : null}
              {mode === 'initials' ? (
                <InitialsMode
                  answer={answer}
                  wordSpaces={wordSpaces}
                  revealed={revealed}
                  hint={locus.hint}
                />
              ) : null}
              {mode === 'blur' ? (
                <BlurMode answer={answer} revealed={revealed} hint={locus.hint} />
              ) : null}
              {mode === 'words' ? (
                <RebuildMode answer={answer} hint={locus.hint} onSolved={solve} />
              ) : null}
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

/** The "where to picture it" cue, shown with the answer once it's on the table. */
function HintCard({ hint }: { hint: string }) {
  const { t } = useTranslation()
  return (
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
  )
}

function RevealedAnswer({ answer, hint }: { answer: string; hint?: string }) {
  return (
    <ModeScroll>
      <p className="allow-select text-balance break-words text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {hint ? <HintCard hint={hint} /> : null}
    </ModeScroll>
  )
}

/** A token the initials keyboard can't type — a verse reference like "14:1", or bare
 * punctuation. These auto-fill as the attempt reaches them. */
function isAutoToken(token: string): boolean {
  return isReferenceMarker(token) || wordInitial(token).initial === ''
}

function TypeMode({
  answer,
  initialsOnly,
  onInitialsOnly,
  onSolved,
  onFocusChange,
}: {
  answer: string
  initialsOnly: boolean
  onInitialsOnly: (value: boolean) => void
  onSolved: () => void
  onFocusChange?: (focused: boolean) => void
}) {
  const { t } = useTranslation()
  const [resetKey, setResetKey] = useState(0)

  // Blur reports false even when the field is torn down on card change, so the panel's own
  // per-card reset is the backstop.
  useEffect(() => () => onFocusChange?.(false), [onFocusChange])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <SegmentedControl
          size="sm"
          className="max-w-[220px] flex-1"
          aria-label={t('study.typeAid')}
          value={initialsOnly ? 'initials' : 'full'}
          options={[
            { value: 'full', label: t('study.typeFull') },
            { value: 'initials', label: t('study.typeInitialsOnly') },
          ]}
          onChange={(value) => onInitialsOnly(value === 'initials')}
        />
        <button
          type="button"
          onClick={() => setResetKey((key) => key + 1)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {t('study.startOver')}
        </button>
      </div>

      {initialsOnly ? (
        <TypeInitials
          key={`initials-${resetKey}`}
          answer={answer}
          onSolved={onSolved}
          onFocusChange={onFocusChange}
        />
      ) : (
        <TypeFull
          key={`full-${resetKey}`}
          answer={answer}
          onSolved={onSolved}
          onFocusChange={onFocusChange}
        />
      )}
    </div>
  )
}

function TypeFull({
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
  const expected = useMemo(() => tokenizeWords(answer), [answer])
  const result = typedRecallStatus(answer, value)
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0

  useEffect(() => {
    if (result.complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.complete])

  return (
    <>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder={t('study.typePlaceholder')}
        aria-label={t('study.typePlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-[72px] w-full flex-1 resize-none rounded-card border border-border bg-card px-4 py-3 text-[length:var(--p-text-body)] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />

      <div className="max-h-44 shrink-0 overflow-y-auto scrollbar-hide rounded-card bg-info-surface px-4 py-3">
        <RecallProgress correct={result.correct} total={result.total} pct={pct} />
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
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-[length:var(--p-text-body)] font-medium leading-relaxed">
            {result.statuses.map((status, i) => {
              if (status === 'pending') return null
              if (status === 'correct') {
                return (
                  <span key={i} className="text-[var(--success-foreground)]">
                    {expected[i]}
                  </span>
                )
              }
              // A miss shows the correction in place, the way a teacher would mark it:
              // what was typed struck through, the expected word highlighted beside it.
              return (
                <span key={i} className="inline-flex items-baseline gap-1">
                  <span className="rounded-[6px] bg-[var(--danger-surface)] px-1 text-[var(--danger-on-surface)] line-through decoration-2">
                    {result.typed[i]}
                  </span>
                  <span className="rounded-[6px] bg-[var(--warning-surface)] px-1 font-semibold text-[var(--warning-foreground)]">
                    {expected[i]}
                  </span>
                </span>
              )
            })}
          </p>
        )}
      </div>
    </>
  )
}

const WRONG_LETTER_MS = 650

function TypeInitials({
  answer,
  onSolved,
  onFocusChange,
}: {
  answer: string
  onSolved: () => void
  onFocusChange?: (focused: boolean) => void
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])

  const advanceAuto = (from: number): number => {
    let index = from
    while (index < tokens.length && isAutoToken(tokens[index]!)) index += 1
    return index
  }

  const [accepted, setAccepted] = useState(() => advanceAuto(0))
  const [wrong, setWrong] = useState<{ char: string; seq: number } | null>(null)
  const wrongTimer = useRef<number | undefined>(undefined)
  const seq = useRef(0)

  useEffect(() => () => window.clearTimeout(wrongTimer.current), [])

  const typable = useMemo(() => tokens.filter((token) => !isAutoToken(token)), [tokens])
  const typedCount = tokens.slice(0, accepted).filter((token) => !isAutoToken(token)).length
  const pct = typable.length > 0 ? Math.round((typedCount / typable.length) * 100) : 100
  const complete = tokens.length > 0 && accepted >= tokens.length

  useEffect(() => {
    if (complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete])

  const flashWrong = (char: string) => {
    seq.current += 1
    setWrong({ char, seq: seq.current })
    window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => setWrong(null), WRONG_LETTER_MS)
  }

  // The input is kept empty on purpose: each keystroke is judged and consumed, a wrong
  // letter is rejected with a flash instead of accumulating — so there is nothing to erase.
  const handleInput = (raw: string) => {
    let next = accepted
    let rejected: string | null = null
    for (const char of raw) {
      if (next >= tokens.length) break
      if (!/[\p{L}\p{N}]/u.test(char)) continue
      const cue = wordInitial(tokens[next]!).initial
      if (cue && normalizeInitial(char) === normalizeInitial(cue.charAt(0))) {
        next = advanceAuto(next + 1)
      } else {
        rejected = char
      }
    }
    if (next !== accepted) setAccepted(next)
    if (rejected) flashWrong(rejected)
  }

  return (
    <>
      <input
        type="text"
        value=""
        onChange={(event) => handleInput(event.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder={t('study.initialsPlaceholder')}
        aria-label={t('study.initialsPlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        className="h-12 w-full shrink-0 rounded-card border border-border bg-card px-4 text-[length:var(--p-text-body)] text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />

      <div className="relative flex min-h-0 flex-1 flex-col rounded-card bg-info-surface px-4 py-3">
        <RecallProgress correct={typedCount} total={typable.length} pct={pct} />
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
          {complete ? (
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-[var(--success-foreground)]">
              <Sparkles className="size-4" aria-hidden />
              {t('study.wordPerfect')}
            </p>
          ) : typedCount === 0 ? (
            <p className="mb-1.5 text-[length:var(--p-text-label)] text-muted-foreground">
              {t('study.initialsFeedbackHint')}
            </p>
          ) : null}
          {accepted > 0 ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-[length:var(--p-text-body)] font-medium leading-relaxed">
              {tokens.slice(0, accepted).map((token, i) => (
                <span
                  key={i}
                  className={
                    isReferenceMarker(token)
                      ? 'font-bold text-accent'
                      : 'text-[var(--success-foreground)]'
                  }
                >
                  {token}
                </span>
              ))}
            </p>
          ) : null}
        </div>

        {/* The rejected-letter flash: an iOS-key-style bubble over the feedback area. */}
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <AnimatePresence>
            {wrong ? (
              <motion.div
                key={wrong.seq}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 12 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                aria-hidden
                className="grid h-16 w-14 place-items-center rounded-card bg-[var(--danger)] text-[26px] font-bold text-white shadow-elevated"
              >
                {wrong.char}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <span aria-live="polite" className="sr-only">
          {wrong ? t('study.wrongLetter', { letter: wrong.char }) : ''}
        </span>
      </div>
    </>
  )
}

/** The shared attempt-progress row: a spring-filled bar plus an n / total tally. */
function RecallProgress({ correct, total, pct }: { correct: number; total: number; pct: number }) {
  return (
    <div className="mb-2 flex shrink-0 items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        />
      </div>
      <span className="shrink-0 text-[length:var(--p-text-label)] font-bold tabular-nums text-heading">
        {correct} / {total}
      </span>
    </div>
  )
}

function InitialsMode({
  answer,
  wordSpaces,
  revealed,
  hint,
}: {
  answer: string
  wordSpaces: boolean
  revealed: boolean
  hint?: string
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const [peek, setPeek] = useState<number | null>(null)

  return (
    <ModeScroll onClick={() => setPeek(null)}>
      <p
        className={cn(
          'flex w-full flex-wrap items-baseline justify-center gap-y-3 text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
          wordSpaces ? 'gap-x-3' : 'gap-x-2',
          // Headroom for the peek bubble over a first-line word.
          !revealed && 'pt-9',
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
          if (revealed) {
            return (
              <span key={i} className="whitespace-nowrap">
                {token}
              </span>
            )
          }
          const { lead, initial, hidden, trail } = wordInitial(token)
          const open = peek === i
          return (
            <span key={i} className="relative inline-block">
              <button
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
              </button>
              {/* Peeking shows the word as a bubble above its initial, so the line never
                  reflows and the surrounding cues hold still. */}
              <span className="pointer-events-none absolute inset-x-0 bottom-full mb-1.5 flex justify-center">
                <AnimatePresence>
                  {open ? (
                    <motion.span
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.9 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                      aria-hidden
                      className="whitespace-nowrap rounded-control bg-primary px-2.5 py-1.5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive"
                    >
                      {token}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </span>
            </span>
          )
        })}
      </p>
      {revealed && hint ? <HintCard hint={hint} /> : null}
    </ModeScroll>
  )
}

/** Fraction of the hideable words each "Hide words" press takes away (of the total, sampled
 * from the still-visible ones) — three presses hide a whole verse. */
const BLUR_BATCH = 3

function BlurMode({
  answer,
  revealed,
  hint,
}: {
  answer: string
  revealed: boolean
  hint?: string
}) {
  const { t } = useTranslation()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
  // Everything starts visible; each "Hide words" press blanks another random batch, a tap on
  // a blank peeks that word back, "Show all" resets. Grading stays with the footer reveal.
  const [hidden, setHidden] = useState<ReadonlySet<number>>(() => new Set<number>())
  const visible = hideable.filter((i) => !hidden.has(i))

  const hideMore = () => {
    const batch = Math.max(1, Math.ceil(hideable.length / BLUR_BATCH))
    const picks = scramble(visible).slice(0, batch)
    setHidden((prev) => new Set([...prev, ...picks]))
  }

  const showWord = (index: number) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }

  return (
    <ModeScroll>
      <p className="flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-2.5 text-[clamp(17px,4.6vw,22px)] font-semibold leading-relaxed text-heading">
        {tokens.map((token, i) => {
          if (isReferenceMarker(token)) {
            return (
              <span key={i} className="font-bold text-accent">
                {token}
              </span>
            )
          }
          if (revealed || !hidden.has(i)) {
            return (
              <span key={i} className="whitespace-nowrap">
                {token}
              </span>
            )
          }
          return (
            <button
              key={i}
              type="button"
              aria-label={t('study.revealWord', { word: token })}
              onClick={() => showWord(i)}
              className="rounded-control px-0.5 transition-transform active:scale-95"
            >
              <span
                aria-hidden
                className="inline-block h-[0.95em] border-b-2 border-[color-mix(in_oklch,var(--primary)_45%,transparent)] align-baseline"
                style={{ width: `${Math.min(Math.max(normalizeWord(token).length, 2), 14)}ch` }}
              />
            </button>
          )
        })}
      </p>

      {!revealed ? (
        <>
          <div className="flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={hideMore}
              disabled={visible.length === 0}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-control px-4 text-[length:var(--p-text-sub)] font-semibold transition-transform active:scale-[0.97]',
                visible.length === 0
                  ? 'bg-info-surface text-muted-foreground'
                  : 'bg-primary text-primary-foreground shadow-interactive',
              )}
            >
              <EyeOff className="size-4" aria-hidden />
              {t('study.hideWords')}
            </button>
            {hidden.size > 0 ? (
              <button
                type="button"
                onClick={() => setHidden(new Set())}
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-secondary/20 px-4 text-[length:var(--p-text-sub)] font-semibold text-heading transition-transform active:scale-[0.97]"
              >
                <Eye className="size-4" aria-hidden />
                {t('study.showAllWords')}
              </button>
            ) : null}
          </div>
          {hidden.size > 0 ? (
            <p className="text-center text-[length:var(--p-text-label)] text-muted-foreground">
              {t('study.blurHint')}
            </p>
          ) : null}
        </>
      ) : hint ? (
        <HintCard hint={hint} />
      ) : null}
    </ModeScroll>
  )
}

interface WordChip {
  pos: number
  word: string
  key: string
}

function RebuildMode({
  answer,
  hint,
  onSolved,
}: {
  answer: string
  hint?: string
  onSolved: () => void
}) {
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

      {/* Solved: the reconstructed text stays put — no swap to another surface — and the
          footer's grade control takes over. */}
      {done ? (
        <>
          <p className="inline-flex items-center justify-center gap-1.5 text-[length:var(--p-text-sub)] font-semibold text-[var(--success-foreground)]">
            <Sparkles className="size-4" aria-hidden />
            {t('study.rebuilt')}
          </p>
          {hint ? <HintCard hint={hint} /> : null}
        </>
      ) : (
        <>
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

          {placed > 0 ? (
            <button
              type="button"
              onClick={() => {
                setUsedKeys(new Set())
                setWrongKey(null)
              }}
              className="mx-auto inline-flex min-h-9 items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t('study.startOver')}
            </button>
          ) : null}
        </>
      )}
    </ModeScroll>
  )
}
