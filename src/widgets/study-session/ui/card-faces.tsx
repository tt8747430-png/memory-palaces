import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  EyeOff,
  Flag,
  Lightbulb,
  MapPin,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
  Volume2,
  WholeWord,
} from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import {
  cn,
  isReferenceMarker,
  normalizeInitial,
  normalizeWord,
  scramble,
  tokenizeWords,
  typedRecallStatus,
  wordInitial,
} from '@/shared/lib'
import { SegmentedControl, Sheet } from '@/shared/ui'
import type { StudyCard } from '../model/types'

/** Shared props every face needs to dress its header and reveal cues. */
export interface FaceProps {
  card: StudyCard
  mode: StudyMode
  prompt: string
  answer: string
  canSpeak: boolean
  /** Mark blanks for each hidden letter in Initials mode. */
  wordSpaces: boolean
  /** Type mode's aid: type only each word's first letter. */
  typeInitialsOnly: boolean
  /** This face is the one showing (the other is rotated away + inert). */
  active: boolean
  onSpeak: (text: string) => void
  onWordSpaces: (value: boolean) => void
  onTypeInitialsOnly: (value: boolean) => void
  /** Turn the card over both ways (manual tap / keyboard). */
  onFlip: () => void
  /** One-way reveal that flips to the back on a solved Type attempt. */
  onReveal: () => void
  /** One-way reveal that keeps this face up and only moves the grades in (Rebuild, and
   * Type's read-only answer peek). */
  onRevealInPlace: () => void
}

/** Keep a control's press from reaching the deck's drag gesture, so its tap/type fires cleanly
 * and no swipe begins under it. The deck owns the swipe; every interactive control opts out. */
const stopPress = (event: ReactPointerEvent) => event.stopPropagation()

// ─── Scaffold ────────────────────────────────────────────────────────────────

/** The card face scaffold shared by every mode: a fixed header and footer pinned to the
 * card with a scrollable body between them. The body reports its own overflow so the deck
 * can arm swipe only where the content fits — a scrolling verse keeps its pan for reading. */
export function CardFace({
  flagged,
  canSpeak,
  speakText,
  onSpeak,
  active,
  back = false,
  align = 'center',
  footer,
  children,
}: {
  flagged: boolean
  canSpeak: boolean
  speakText: string
  onSpeak: (text: string) => void
  active: boolean
  /** The back face is pre-rotated 180° so the flip lands it un-mirrored — the rotation and the
   * backface-culling must share the one element that fills the card (see StudyDeck's flip). */
  back?: boolean
  /** Vertical alignment of short content. Type top-anchors so its input clears the keyboard. */
  align?: 'center' | 'start'
  footer?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)

  // A scrolling body owns the vertical pan; a fitting one hands it back to the deck for
  // swipe-to-grade. Re-measured whenever the content, mode, or face changes.
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => setScrolls(el.scrollHeight > el.clientHeight + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children])

  // Turning away retires any focused input so the keyboard can't outlive the face.
  useEffect(() => {
    if (active) return
    const el = bodyRef.current
    if (el && el.contains(document.activeElement)) {
      ;(document.activeElement as HTMLElement).blur()
    }
  }, [active])

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col rounded-card-featured bg-card-glass shadow-elevated [backface-visibility:hidden]',
        back && '[transform:rotateY(180deg)]',
      )}
      inert={!active}
    >
      <header className="flex h-9 shrink-0 touch-none items-center justify-end gap-1.5 px-4 pt-2.5">
        {flagged ? (
          <Flag className="size-4 fill-[var(--rating)] text-[var(--rating-edge)]" aria-hidden />
        ) : null}
        {canSpeak ? (
          <button
            type="button"
            onPointerDown={stopPress}
            onClick={() => onSpeak(speakText)}
            aria-label={t('study.readAloud')}
            className="grid size-7 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-90"
          >
            <Volume2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </header>

      <div
        ref={bodyRef}
        data-card-scroll={scrolls ? '' : undefined}
        style={{ touchAction: scrolls ? 'pan-y' : 'none' }}
        className={cn(
          'relative flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto scrollbar-hide px-5',
          align === 'center' ? 'justify-center' : 'justify-start pt-1',
        )}
      >
        {children}
      </div>

      <footer className="flex min-h-[3.25rem] shrink-0 touch-none items-center justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5">
        {footer}
      </footer>
    </div>
  )
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

/** A footer control chip — the consistent aid affordance across every mode. */
function AidButton({
  icon,
  label,
  onClick,
  disabled,
  primary,
  active,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onPointerDown={stopPress}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-control px-3.5 text-(length:--p-text-label) font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100',
        primary || active
          ? 'bg-primary text-primary-foreground shadow-interactive'
          : 'bg-info-surface text-heading',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

/** The mode's settings gear — opens the per-mode options sheet from the footer. */
function SettingsButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('study.modeSettings')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-[0.97]"
    >
      <Settings2 className="size-[18px]" aria-hidden />
    </button>
  )
}

/** Icon-only reset, tucked into a working surface's corner. */
function ResetButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('study.startOver')}
      onPointerDown={stopPress}
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

/** The peek-a-tip pill shown under a prompt when the locus carries one. */
function TipRow({ tip }: { tip: string }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)
  return (
    <div className="flex min-h-[32px] shrink-0 items-center justify-center">
      {peek ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[36ch] text-pretty text-[length:var(--p-text-label)] italic text-muted-foreground"
        >
          {tip}
        </motion.p>
      ) : (
        <button
          type="button"
          onPointerDown={stopPress}
          onClick={() => setPeek(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-surface)] px-3 py-1.5 text-[length:var(--p-text-label)] font-semibold text-[var(--warning-foreground)]"
        >
          <Lightbulb className="size-3.5" aria-hidden />
          {t('study.peekHint')}
        </button>
      )}
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

/** The full-card flip control: a button covering its content that turns the card. Marked
 * `data-flip` so the deck still lets a fling start on it — it's the tap path, not a swipe wall. */
function FlipZone({
  label,
  onFlip,
  className,
  children,
}: {
  label: string
  onFlip: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      data-flip
      aria-label={label}
      onPointerDown={stopPress}
      onClick={onFlip}
      className={cn('block w-full', className)}
    >
      {children}
    </button>
  )
}

/** The echoed prompt above every back face, so the answer always has its question. Doubles as
 * the "show front" tap target. */
function BackPrompt({ prompt, onFlip }: { prompt: string; onFlip: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <FlipZone label={t('study.showFront')} onFlip={onFlip} className="shrink-0">
        <span className="block truncate text-center text-[length:var(--p-text-label)] font-semibold text-accent">
          {prompt}
        </span>
      </FlipZone>
      <div className="mx-auto h-px w-24 shrink-0 bg-border" aria-hidden />
    </>
  )
}

/** A token the initials keyboard can't type — a verse reference like "14:1", or bare
 * punctuation. These auto-fill as the attempt reaches them. */
function isAutoToken(token: string): boolean {
  return isReferenceMarker(token) || wordInitial(token).initial === ''
}

// ─── Front faces ─────────────────────────────────────────────────────────────

/** Blur / Initials front: the bare prompt. The whole face flips (deck-level tap). */
export function PromptFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, canSpeak, active, onSpeak, onFlip } = props
  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
    >
      <h2 className="text-balance break-words text-center text-[clamp(22px,6vw,28px)] font-bold leading-[1.15] tracking-[-0.01em] text-heading">
        {prompt}
      </h2>
      {card.locus.tip ? <TipRow tip={card.locus.tip} /> : null}
      <FlipZone label={t('study.showAnswer')} onFlip={onFlip} className="mx-auto w-fit">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-surface px-3.5 py-1.5 text-[length:var(--p-text-label)] font-medium text-muted-foreground">
          {t('study.tapToReveal')}
        </span>
      </FlipZone>
    </CardFace>
  )
}

/** Type front: recall the answer by typing it, aided by a full-text or first-letters mode. */
export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, typeInitialsOnly, active, onSpeak } = props
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [peeking, setPeeking] = useState(false)

  const peek = () => {
    setPeeking(true)
    props.onRevealInPlace()
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <AidButton
        icon={
          peeking ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )
        }
        label={peeking ? t('study.hideAnswer') : t('study.revealAnswer')}
        onClick={() => (peeking ? setPeeking(false) : peek())}
        active={peeking}
      />
      <SettingsButton onClick={() => setSettingsOpen(true)} />
    </div>
  )

  return (
    <>
      <CardFace
        flagged={card.locus.flagged}
        canSpeak={canSpeak}
        speakText={prompt}
        onSpeak={onSpeak}
        active={active}
        align="start"
        footer={footer}
      >
        <div className="shrink-0 text-center">
          <h2 className="text-balance break-words text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
            {prompt}
          </h2>
          {card.locus.tip ? <TipRow tip={card.locus.tip} /> : null}
        </div>
        <div className="h-px shrink-0 bg-border" aria-hidden />
        {peeking ? (
          <div className="allow-select rounded-card bg-info-surface px-4 py-3 text-[length:var(--p-text-body)] font-medium leading-relaxed text-heading">
            {answer}
          </div>
        ) : typeInitialsOnly ? (
          <TypeInitials answer={answer} onSolved={props.onReveal} />
        ) : (
          <TypeFull answer={answer} onSolved={props.onReveal} />
        )}
      </CardFace>

      <Sheet
        open={settingsOpen}
        onOpenChange={(open) => !open && setSettingsOpen(false)}
        title={t('study.modeType')}
      >
        <div className="pb-2">
          <SegmentedControl
            value={typeInitialsOnly ? 'initials' : 'full'}
            options={[
              { value: 'full', label: t('study.typeFull') },
              { value: 'initials', label: t('study.typeInitialsOnly') },
            ]}
            onChange={(value) => props.onTypeInitialsOnly(value === 'initials')}
            aria-label={t('study.typeAid')}
          />
        </div>
      </Sheet>
    </>
  )
}

function TypeFull({ answer, onSolved }: { answer: string; onSolved: () => void }) {
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
        onPointerDown={stopPress}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t('study.typePlaceholder')}
        aria-label={t('study.typePlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-[92px] w-full flex-1 resize-none rounded-card border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
              // A miss shows the correction in place, the way a teacher would mark it.
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

function TypeInitials({ answer, onSolved }: { answer: string; onSolved: () => void }) {
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

  // Reveal the next expected word outright when a cue won't come — the "Next word" aid.
  const nextWord = () => {
    if (accepted < tokens.length) setAccepted(advanceAuto(accepted + 1))
  }

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
      <div
        onPointerDown={stopPress}
        onClick={() => inputRef.current?.focus()}
        className="relative flex min-h-[92px] flex-1 cursor-text flex-col rounded-card bg-info-surface transition-shadow focus-within:ring-2 focus-within:ring-primary/30"
      >
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={(event) => handleInput(event.target.value)}
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

      {!complete ? (
        <button
          type="button"
          onPointerDown={stopPress}
          onClick={nextWord}
          className="mx-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 text-[length:var(--p-text-label)] font-semibold text-muted-foreground transition-colors active:text-heading"
        >
          <SkipForward className="size-3.5" aria-hidden />
          {t('study.nextWord')}
        </button>
      ) : null}
    </>
  )
}

interface WordChip {
  pos: number
  word: string
  key: string
}

/** Rebuild front: tap the scrambled word-chips back into order, or fill them at once. */
export function RebuildFace(props: FaceProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const { card, answer, prompt, canSpeak, active, onSpeak } = props
  const words = useMemo(() => tokenizeWords(answer), [answer])
  const chips = useMemo<WordChip[]>(
    () => scramble(words.map((word, pos) => ({ pos, word, key: `${pos}-${word}` }))),
    [words],
  )
  const [usedKeys, setUsedKeys] = useState<Set<string>>(() => new Set())
  const [wrongKey, setWrongKey] = useState<string | null>(null)
  const placed = usedKeys.size
  const done = words.length > 0 && placed >= words.length

  useEffect(() => {
    if (done) props.onRevealInPlace()
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

  const fillAll = () => setUsedKeys(new Set(chips.map((chip) => chip.key)))
  const startOver = () => {
    setUsedKeys(new Set())
    setWrongKey(null)
  }

  const footer = done ? null : (
    <div className="flex items-center justify-center gap-2">
      <AidButton
        icon={<Sparkles className="size-4" aria-hidden />}
        label={t('study.autoFill')}
        onClick={fillAll}
        primary
      />
      <AidButton
        icon={<RotateCcw className="size-4" aria-hidden />}
        label={t('study.startOver')}
        onClick={startOver}
        disabled={placed === 0}
      />
    </div>
  )

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      align="start"
      footer={footer}
    >
      <div className="shrink-0 text-center">
        <h2 className="text-balance break-words text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {card.locus.tip ? <TipRow tip={card.locus.tip} /> : null}
      </div>
      <div className="h-px shrink-0 bg-border" aria-hidden />

      <p className="min-h-[32px] shrink-0 text-balance text-center text-[clamp(16px,4.4vw,20px)] font-semibold leading-relaxed text-heading">
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
              onPointerDown={stopPress}
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
    </CardFace>
  )
}

// ─── Back faces ──────────────────────────────────────────────────────────────

/** Type / Rebuild back: the plain answer, with its hint. */
export function AnswerFace(props: FaceProps) {
  const { card, prompt, answer, canSpeak, active, onSpeak } = props
  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={answer}
      onSpeak={onSpeak}
      active={active}
      back
    >
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
      <p className="allow-select text-balance break-words text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {card.locus.hint ? <HintCard hint={card.locus.hint} /> : null}
    </CardFace>
  )
}

/** Fraction of the hideable words each "Hide" press takes away — three presses hide a verse. */
const BLUR_BATCH = 3

/** Blur back: opens fully visible; hide random batches, tap a blank to peek, show all to reset. */
export function BlurFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, active, onSpeak } = props
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const hideable = useMemo(
    () => tokens.flatMap((token, i) => (isReferenceMarker(token) ? [] : [i])),
    [tokens],
  )
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

  const footer = (
    <div className="flex items-center justify-center gap-2">
      <AidButton
        icon={<EyeOff className="size-4" aria-hidden />}
        label={t('study.hideWords')}
        onClick={hideMore}
        disabled={visible.length === 0}
        primary
      />
      <AidButton
        icon={<Eye className="size-4" aria-hidden />}
        label={t('study.showAllWords')}
        onClick={() => setHidden(new Set())}
        disabled={hidden.size === 0}
      />
    </div>
  )

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={answer}
      onSpeak={onSpeak}
      active={active}
      back
      footer={footer}
    >
      <BackPrompt prompt={prompt} onFlip={props.onFlip} />
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
              onPointerDown={stopPress}
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
      {card.locus.hint ? <HintCard hint={card.locus.hint} /> : null}
    </CardFace>
  )
}

/** Where the peek bubble sits, in the mode surface's own coordinates. */
interface PeekPosition {
  index: number
  x: number
  top: number
  below: boolean
}

/** Initials back: first letters only. Tap a word to peek it, or reveal every word at once. */
export function InitialsFace(props: FaceProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const { card, prompt, answer, canSpeak, wordSpaces, active, onSpeak } = props
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const tokens = useMemo(() => tokenizeWords(answer), [answer])
  const rootRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const [peek, setPeek] = useState<PeekPosition | null>(null)

  const openPeek = (index: number, el: HTMLElement) => {
    const root = rootRef.current
    if (!root) return
    const rootBox = root.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    const below = box.top - rootBox.top < 44
    setPeek({
      index,
      x: box.left + box.width / 2 - rootBox.left,
      top: below ? box.bottom - rootBox.top + 6 : box.top - rootBox.top - 6,
      below,
    })
  }

  useLayoutEffect(() => {
    if (!peek) return
    const bubble = bubbleRef.current
    const root = rootRef.current
    if (!bubble || !root) return
    const half = bubble.offsetWidth / 2
    const clamped = Math.min(Math.max(peek.x, 4 + half), root.clientWidth - 4 - half)
    if (Math.abs(clamped - peek.x) > 0.5) setPeek({ ...peek, x: clamped })
  }, [peek])

  const footer = (
    <div className="flex items-center justify-center gap-2">
      <AidButton
        icon={<WholeWord className="size-4" aria-hidden />}
        label={showAll ? t('study.showInitials') : t('study.showWords')}
        onClick={() => {
          setShowAll((prev) => !prev)
          setPeek(null)
        }}
        active={showAll}
      />
      <SettingsButton onClick={() => setSettingsOpen(true)} />
    </div>
  )

  return (
    <>
      <CardFace
        flagged={card.locus.flagged}
        canSpeak={canSpeak}
        speakText={answer}
        onSpeak={onSpeak}
        active={active}
        back
        footer={footer}
      >
        <BackPrompt prompt={prompt} onFlip={props.onFlip} />
        <div ref={rootRef} className="relative w-full" onClick={() => setPeek(null)}>
          <p
            className={cn(
              'flex w-full flex-wrap items-baseline justify-center gap-y-3 text-[clamp(17px,4.6vw,22px)] font-semibold text-heading',
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
              if (showAll) {
                return (
                  <span key={i} className="whitespace-nowrap">
                    {token}
                  </span>
                )
              }
              const { lead, initial, hidden, trail } = wordInitial(token)
              const open = peek?.index === i
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={t('study.revealWord', { word: token })}
                  onPointerDown={stopPress}
                  onClick={(event) => {
                    event.stopPropagation()
                    if (open) setPeek(null)
                    else openPeek(i, event.currentTarget)
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
              )
            })}
          </p>

          <AnimatePresence>
            {peek ? (
              <span
                key={peek.index}
                aria-hidden
                className={cn(
                  'pointer-events-none absolute z-20 -translate-x-1/2',
                  !peek.below && '-translate-y-full',
                )}
                style={{ left: peek.x, top: peek.top }}
              >
                <motion.span
                  ref={bubbleRef}
                  initial={
                    reduce ? { opacity: 0 } : { opacity: 0, y: peek.below ? -6 : 6, scale: 0.9 }
                  }
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                  className="block whitespace-nowrap rounded-control bg-primary px-2.5 py-1.5 text-[length:var(--p-text-sub)] font-semibold text-primary-foreground shadow-interactive"
                >
                  {tokens[peek.index]}
                </motion.span>
              </span>
            ) : null}
          </AnimatePresence>
        </div>
        {card.locus.hint ? <HintCard hint={card.locus.hint} /> : null}
      </CardFace>

      <Sheet
        open={settingsOpen}
        onOpenChange={(open) => !open && setSettingsOpen(false)}
        title={t('study.modeInitials')}
      >
        <label className="flex items-center justify-between gap-3 pb-2">
          <span className="min-w-0">
            <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
              {t('study.wordSpaces')}
            </span>
            <span className="block text-[length:var(--p-text-label)] text-muted-foreground">
              {t('study.wordSpacesHint')}
            </span>
          </span>
          <input
            type="checkbox"
            checked={wordSpaces}
            onChange={(event) => props.onWordSpaces(event.target.checked)}
            className="size-6 shrink-0 accent-primary"
          />
        </label>
      </Sheet>
    </>
  )
}
