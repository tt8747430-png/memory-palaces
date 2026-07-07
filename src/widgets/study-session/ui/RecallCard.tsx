import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Flag, Lightbulb, MapPin, RotateCcw, Volume2 } from 'lucide-react'
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
import type { StudyCard, StudyDirection } from '../model/types'

export interface RecallCardProps {
  card: StudyCard
  /** Which recall mode dresses the back face. `flip` is handled by `StudyCardDeck`, not here. */
  mode: Exclude<StudyMode, 'flip'>
  direction: StudyDirection
  /** Mark blanks for each hidden letter in Initials mode. */
  wordSpaces: boolean
  /** True once the card is flipped — the panel swaps its footer to the grade buttons. */
  revealed: boolean
  canSpeak: boolean
  /** The keyboard is up — compress the prompt block so the working area keeps its room. */
  compact: boolean
  /** Type mode's aid: type only each word's first letter instead of the full text. */
  typeInitialsOnly: boolean
  /** Flip to the back (idempotent). Fired by the footer button, the front face, and a
   * completed attempt. */
  onReveal: () => void
  onSpeak: (text: string) => void
  /** Type mode reports its input focus so the panel can stand its footer down for the keyboard. */
  onInputFocusChange?: (focused: boolean) => void
}

/** The non-flip study surface, shaped like a flip flashcard: the front is the prompt alone
 * (recite from memory), the back is the answer dressed by the mode — plain text after Type,
 * blanked words in Blur, first letters in Initials. Rebuild and Type work on the front and
 * flip on completion; Rebuild keeps its reconstructed text in place instead of swapping.
 * Keyed per card by the panel, so each mode's attempt state resets on the next card. */
export function RecallCard({
  card,
  mode,
  direction,
  wordSpaces,
  revealed,
  canSpeak,
  compact,
  typeInitialsOnly,
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

  const face = (): ReactNode => {
    if (mode === 'type') {
      return revealed ? (
        <BackFace key="answer" answer={answer} hint={locus.hint} />
      ) : (
        <WorkFace key="type">
          <TypeMode
            answer={answer}
            initialsOnly={typeInitialsOnly}
            onSolved={solve}
            onFocusChange={onInputFocusChange}
          />
        </WorkFace>
      )
    }
    if (mode === 'words') {
      // A completed rebuild stays put — only an abandoned one shows the plain answer.
      return revealed && !solved ? (
        <BackFace key="answer" answer={answer} hint={locus.hint} />
      ) : (
        <WorkFace key="words">
          <RebuildMode answer={answer} onSolved={solve} />
        </WorkFace>
      )
    }
    // Blur / Initials ARE the back face; the front is the bare prompt.
    if (!revealed) return <FrontFace key="front" onReveal={onReveal} />
    return (
      <WorkFace key={mode}>
        {mode === 'blur' ? (
          <BlurMode answer={answer} hint={locus.hint} />
        ) : (
          <InitialsMode answer={answer} wordSpaces={wordSpaces} hint={locus.hint} />
        )}
      </WorkFace>
    )
  }

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
        <AnimatePresence mode="wait">{face()}</AnimatePresence>
      </div>
    </div>
  )
}

/** The animated shell every face shares. */
function WorkFace({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}

/** The bare front: recite from memory, then flip — the whole area is the flip control. */
function FrontFace({ onReveal }: { onReveal: () => void }) {
  const { t } = useTranslation()
  return (
    <motion.button
      type="button"
      onClick={onReveal}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 flex-1 items-center justify-center"
    >
      <span className="text-[length:var(--p-text-label)] font-medium text-muted-foreground">
        {t('study.tapToReveal')}
      </span>
    </motion.button>
  )
}

function BackFace({ answer, hint }: { answer: string; hint?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ModeScroll>
        <p className="allow-select text-balance break-words text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
          {answer}
        </p>
        {hint ? <HintCard hint={hint} /> : null}
      </ModeScroll>
    </motion.div>
  )
}

/** The centered-scroll shell every mode shares: content sits centered when it's short and
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

/** Icon-only reset, tucked into a working surface's corner. */
function ResetButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('study.startOver')}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-control text-muted-foreground transition-transform active:scale-90',
        className,
      )}
    >
      <RotateCcw className="size-4" aria-hidden />
    </button>
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
  onSolved,
  onFocusChange,
}: {
  answer: string
  initialsOnly: boolean
  onSolved: () => void
  onFocusChange?: (focused: boolean) => void
}) {
  // Blur reports false even when the field is torn down on card change, so the panel's own
  // per-card reset is the backstop.
  useEffect(() => () => onFocusChange?.(false), [onFocusChange])

  return initialsOnly ? (
    <TypeInitials answer={answer} onSolved={onSolved} onFocusChange={onFocusChange} />
  ) : (
    <TypeFull answer={answer} onSolved={onSolved} onFocusChange={onFocusChange} />
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

  useEffect(() => {
    if (result.complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.complete])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      {/* 16px type: anything smaller makes iOS zoom the page on focus. */}
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
        className="min-h-[96px] w-full flex-1 resize-none rounded-card border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />

      {result.typed.length > 0 ? (
        <div className="relative max-h-44 shrink-0 overflow-y-auto scrollbar-hide rounded-card bg-info-surface py-3 pl-4 pr-11">
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
          <ResetButton onClick={() => setValue('')} className="absolute right-1.5 top-1.5" />
        </div>
      ) : null}
    </div>
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
  const inputRef = useRef<HTMLInputElement>(null)

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

  const typedCount = tokens.slice(0, accepted).filter((token) => !isAutoToken(token)).length
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

  // The input stays empty and invisible: each keystroke is judged and consumed — a correct
  // letter writes its word into the surface, a wrong one flashes and leaves no trace.
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
    // One surface: tap it, type. The real input is visually hidden — no field, no caret,
    // just words appearing (or the wrong-letter flash).
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex min-h-0 flex-1 cursor-text flex-col rounded-card bg-info-surface transition-shadow focus-within:ring-2 focus-within:ring-primary/30"
    >
      <input
        ref={inputRef}
        type="text"
        value=""
        onChange={(event) => handleInput(event.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        aria-label={t('study.initialsPlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        className="sr-only text-base"
      />

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-4 py-3">
        {typedCount === 0 && accepted === 0 ? (
          <p className="text-[length:var(--p-text-body)] text-muted-foreground">
            {t('study.initialsPlaceholder')}
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

      {typedCount > 0 && !complete ? (
        <ResetButton
          onClick={() => setAccepted(advanceAuto(0))}
          className="absolute right-1.5 top-1.5 z-20"
        />
      ) : null}

      {/* The rejected-letter flash: an iOS-key-style bubble over the surface. */}
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
  )
}

function InitialsMode({
  answer,
  wordSpaces,
  hint,
}: {
  answer: string
  wordSpaces: boolean
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
          // pt-9 leaves headroom for the peek bubble over a first-line word.
          'flex w-full flex-wrap items-baseline justify-center gap-y-3 pt-9 text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
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
      {hint ? <HintCard hint={hint} /> : null}
    </ModeScroll>
  )
}

/** Fraction of the hideable words each "Hide" press takes away (of the total, sampled from
 * the still-visible ones) — three presses hide a whole verse. */
const BLUR_BATCH = 3

function BlurMode({ answer, hint }: { answer: string; hint?: string }) {
  const { t } = useTranslation()
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
  // The back opens fully visible; each "Hide" blanks another random batch, a tap on a blank
  // peeks that word back, "Show" restores everything.
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
          if (!hidden.has(i)) {
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

      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={hideMore}
          disabled={visible.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-primary px-5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive transition-transform active:scale-[0.97] disabled:opacity-40 disabled:shadow-none"
        >
          <EyeOff className="size-4" aria-hidden />
          {t('study.hideWords')}
        </button>
        <button
          type="button"
          onClick={() => setHidden(new Set())}
          disabled={hidden.size === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-control bg-secondary/20 px-5 text-[length:var(--p-text-sub)] font-semibold text-heading transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          <Eye className="size-4" aria-hidden />
          {t('study.showAllWords')}
        </button>
      </div>

      {hint ? <HintCard hint={hint} /> : null}
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

  // Completion flips only the footer to the grades; the surface stays exactly as built.
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
          className="mx-auto inline-flex min-h-9 items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {t('study.startOver')}
        </button>
      ) : null}
    </ModeScroll>
  )
}
