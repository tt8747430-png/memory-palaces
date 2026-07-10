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
import { Check, Flag, Lightbulb, MapPin, RotateCcw, SlidersHorizontal, Volume2 } from 'lucide-react'
import type { StudyMode } from '@/entities/preferences'
import type { ModeSwipeAction } from '@/shared/config/flashcard-swipe'
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
import { STUDY_MODE_META } from './mode-meta'
import type { StudyCard } from '../model/types'

/** The mode-specific on-card actions a face publishes for the swipe layer while it's active. */
export type MechanicHandlers = Partial<Record<ModeSwipeAction, () => void>>

/** Shared props every face needs to dress its header, footer, and reveal cues. */
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
  /** Turn the card over both ways (manual tap / keyboard). */
  onFlip: () => void
  /** Solve the card in place: keep this working surface up and move the footer to grades
   * (Rebuild's placed words, Type's typed answer). Tapping then peeks the answer face. */
  onRevealInPlace: () => void
  /** Undo an in-place solve (Reset): drop the built/typed answer and return the footer to
   * the overview. Mirror of {@link onRevealInPlace}. */
  onHideInPlace: () => void
  /** Open the study-mode picker — the footer's left control. */
  onChangeMode: () => void
  /** Open the merged gear sheet — the footer's right control. */
  onOpenGear: () => void
  /** Publish this face's mode-specific swipe mechanics while it is active (Blur hide/show,
   * Rebuild reset, Initials show-words, Type next-word/reset). Cleared when it turns away. */
  registerMechanic?: (handlers: MechanicHandlers | null) => void
}

/** Keep a control's press from reaching the deck's drag gesture, so its tap/type fires cleanly
 * and no swipe begins under it. The deck owns the swipe; every interactive control opts out. */
const stopPress = (event: ReactPointerEvent) => event.stopPropagation()

/** Publish a face's mode-specific mechanics to the deck while active, always calling the latest
 * handler (kept in a ref) so a bound action reflects current state without re-registering. */
function useSwipeMechanic(
  active: boolean,
  register: FaceProps['registerMechanic'],
  handlers: MechanicHandlers,
) {
  const ref = useRef(handlers)
  ref.current = handlers
  useEffect(() => {
    if (!active || !register) return
    register({
      hideMore: () => ref.current.hideMore?.(),
      showAll: () => ref.current.showAll?.(),
      showWords: () => ref.current.showWords?.(),
      reset: () => ref.current.reset?.(),
      nextWord: () => ref.current.nextWord?.(),
    })
    return () => register(null)
  }, [active, register])
}

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
  mode,
  onChangeMode,
  onOpenGear,
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
  /** Current mode — drives the footer's mode-switch icon. */
  mode: StudyMode
  /** Open the mode picker from the footer's left control. */
  onChangeMode: () => void
  /** Open the merged gear sheet from the footer's right control. */
  onOpenGear: () => void
  /** The back face is pre-rotated 180° so the flip lands it un-mirrored — the rotation and the
   * backface-culling must share the one element that fills the card (see StudyDeck's flip). */
  back?: boolean
  /** Vertical alignment of short content. Type top-anchors so its input clears the keyboard. */
  align?: 'center' | 'start'
  /** The mode's reveal/undo aids, centered in the footer. */
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

      <footer className="flex min-h-[3.25rem] shrink-0 touch-none items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5">
        <ModeButton mode={mode} onClick={onChangeMode} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
          {footer}
        </div>
        <GearButton onClick={onOpenGear} />
      </footer>
    </div>
  )
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

/** The one aid affordance shared by every mode's footer — same shape, size, and tint
 * everywhere so the modes read as one family. Text-only on purpose: an icon here would
 * clash with each mode's own glyphs. Each mode gives it a verb ("Blur", "Show all", "Reset",
 * "Next word"); an aid with nothing to do no-ops, it is never disabled, so the control set
 * never shifts under the thumb. */
function AidButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={stopPress}
      onClick={onClick}
      className="inline-flex min-h-11 items-center rounded-control bg-info-surface px-4 text-(length:--p-text-label) font-semibold text-heading transition-transform active:scale-[0.97]"
    >
      {label}
    </button>
  )
}

/** The mode picker, pinned to the footer's left — the single place to switch how the answer
 * is recalled. Wears the active mode's own icon. */
function ModeButton({ mode, onClick }: { mode: StudyMode; onClick: () => void }) {
  const { t } = useTranslation()
  const Icon = STUDY_MODE_META[mode].Icon
  return (
    <button
      type="button"
      aria-label={t('study.changeMode')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-[0.97]"
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  )
}

/** The footer's right control: the one merged gear — quick actions, this mode's options and
 * swipe map, and the session settings all live behind it. Thumb-reachable, present every mode. */
function GearButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t('study.options')}
      onPointerDown={stopPress}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-control bg-info-surface text-heading transition-transform active:scale-[0.97]"
    >
      <SlidersHorizontal className="size-[18px]" aria-hidden />
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

/** The "you got it" marker shown on the working surface once a Type/Rebuild card is solved
 * in place — the cue that the footer's grades are now live and the answer is a tap away. */
function SolvedBadge() {
  const { t } = useTranslation()
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className="inline-flex items-center gap-1.5 rounded-pill bg-[var(--success-surface)] px-3 py-1 text-(length:--p-text-label) font-bold text-[var(--success-on-surface)]"
    >
      <Check className="size-3.5" aria-hidden />
      {t('study.solvedTapToSee')}
    </motion.span>
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
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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

/** Type front: recall the answer by typing it, aided by a full-text or first-letters mode.
 * Solving reveals the grades in place (the typed answer stays up); a tap then peeks the answer.
 * "Next word" (first-letters) morphs into "Reset" once solved so the control never vanishes. */
export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, typeInitialsOnly, active, onSpeak } = props
  const [fullValue, setFullValue] = useState('')
  // The first-letters recall lives here (not in the child) so its "Next word" aid can sit in
  // the shared footer; it only grades on completion while first-letters mode is active.
  const initials = useInitialsRecall(answer, typeInitialsOnly, props.onRevealInPlace)
  const fullResult = typedRecallStatus(answer, fullValue)
  const solved = typeInitialsOnly ? initials.complete : fullResult.complete

  // Full-text solve reveals in place too (mirrors first-letters, whose recall reports its own).
  useEffect(() => {
    if (!typeInitialsOnly && fullResult.complete) props.onRevealInPlace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeInitialsOnly, fullResult.complete])

  const resetType = () => {
    if (typeInitialsOnly) initials.reset()
    else setFullValue('')
    props.onHideInPlace()
  }

  // Swipe mechanics for this mode: advance a word (first-letters, before solving) and reset.
  useSwipeMechanic(active, props.registerMechanic, {
    nextWord: typeInitialsOnly && !initials.complete ? initials.nextWord : undefined,
    reset: resetType,
  })

  const footer = solved ? (
    <AidButton label={t('study.reset')} onClick={resetType} />
  ) : typeInitialsOnly ? (
    <AidButton label={t('study.nextWord')} onClick={initials.nextWord} />
  ) : null

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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
      {solved ? (
        <div className="flex shrink-0 justify-center">
          <SolvedBadge />
        </div>
      ) : null}
      {typeInitialsOnly ? (
        <TypeInitials recall={initials} />
      ) : (
        <TypeFull value={fullValue} onChange={setFullValue} answer={answer} result={fullResult} />
      )}
    </CardFace>
  )
}

function TypeFull({
  value,
  onChange,
  answer,
  result,
}: {
  value: string
  onChange: (value: string) => void
  answer: string
  result: ReturnType<typeof typedRecallStatus>
}) {
  const { t } = useTranslation()
  const expected = useMemo(() => tokenizeWords(answer), [answer])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      {/* 16px type: anything smaller makes iOS zoom the page on focus. */}
      <textarea
        value={value}
        onPointerDown={stopPress}
        onChange={(event) => onChange(event.target.value)}
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
          <ResetButton onClick={() => onChange('')} className="absolute right-1.5 top-1.5" />
        </div>
      ) : null}
    </div>
  )
}

const WRONG_LETTER_MS = 650

/** What `useInitialsRecall` exposes to the Type face and its footer aid. */
interface InitialsRecall {
  tokens: string[]
  accepted: number
  typedCount: number
  complete: boolean
  wrong: { char: string; seq: number } | null
  /** Unlock the next expected word outright (the footer's "Next word" aid). */
  nextWord: () => void
  handleInput: (raw: string) => void
  reset: () => void
}

/** First-letters recall state, lifted out of the input so the "Next word" aid can live in the
 * shared footer. Accepts a keystroke only when it matches the next word's cue; a miss flashes
 * the rejected letter. Auto-tokens (references, punctuation) fill themselves. Only reports a
 * solve while `enabled`, so it can't grade a card that is being typed in full-text mode. */
function useInitialsRecall(answer: string, enabled: boolean, onSolved: () => void): InitialsRecall {
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

  const typedCount = tokens.slice(0, accepted).filter((token) => !isAutoToken(token)).length
  const complete = tokens.length > 0 && accepted >= tokens.length

  useEffect(() => {
    if (enabled && complete) onSolved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, complete])

  const flashWrong = (char: string) => {
    seq.current += 1
    setWrong({ char, seq: seq.current })
    window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => setWrong(null), WRONG_LETTER_MS)
  }

  // Functional so the "Next word" aid stays a stable handler for the swipe mechanic.
  const nextWord = () => setAccepted((prev) => (prev < tokens.length ? advanceAuto(prev + 1) : prev))

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

  const reset = () => setAccepted(advanceAuto(0))

  return { tokens, accepted, typedCount, complete, wrong, nextWord, handleInput, reset }
}

/** First-letters input surface — a hidden field that accepts one cue at a time, the accepted
 * words rendered as they land. Marked `data-card-control` so a tap here types (focuses the
 * field) instead of flipping the card. */
function TypeInitials({ recall }: { recall: InitialsRecall }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const { tokens, accepted, typedCount, complete, wrong, handleInput, reset } = recall

  return (
    <>
      <div
        data-card-control
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
          <ResetButton onClick={reset} className="absolute right-1.5 top-1.5 z-20" />
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
    </>
  )
}

interface WordChip {
  pos: number
  word: string
  key: string
}

/** Rebuild front: tap the scrambled word-chips back into order. Solving reveals the grades in
 * place — the reconstruction stays up; a tap then peeks the answer face. Reset clears it. */
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

  // Reset clears the placed words AND un-reveals (so a solved card's footer returns from grades
  // to the overview). Stays mounted through `done`, so a solved card is never trapped.
  const reset = () => {
    setUsedKeys(new Set())
    setWrongKey(null)
    props.onHideInPlace()
  }

  useSwipeMechanic(active, props.registerMechanic, { reset })

  const footer = <AidButton label={t('study.reset')} onClick={reset} />

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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

      {done ? (
        <div className="flex shrink-0 justify-center">
          <SolvedBadge />
        </div>
      ) : null}

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
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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

  useSwipeMechanic(active, props.registerMechanic, {
    hideMore,
    showAll: () => setHidden(new Set()),
  })

  // Blur takes away another batch (no-op once nothing is left visible); Show all reveals
  // everything (no-op once all words are visible) — neither ever disables, so the pair holds
  // still. Text labels only: an eye icon here would echo the mode's own eye glyph.
  const footer = (
    <>
      <AidButton label={t('study.blur')} onClick={hideMore} />
      <AidButton label={t('study.showAll')} onClick={() => setHidden(new Set())} />
    </>
  )

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={answer}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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

  const toggleWords = () => {
    setShowAll((prev) => !prev)
    setPeek(null)
  }

  useSwipeMechanic(active, props.registerMechanic, { showWords: toggleWords })

  // One toggle: spell every word out, or drop back to first-letters. Peeks close either way.
  const footer = (
    <AidButton
      label={showAll ? t('study.showInitials') : t('study.showWords')}
      onClick={toggleWords}
    />
  )

  return (
    <CardFace
      flagged={card.locus.flagged}
      canSpeak={canSpeak}
      speakText={answer}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
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
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: peek.below ? -6 : 6, scale: 0.9 }}
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
  )
}
