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

export type MechanicHandlers = Partial<Record<ModeSwipeAction, () => void>>

export interface FaceProps {
  card: StudyCard
  mode: StudyMode
  prompt: string
  answer: string
  canSpeak: boolean
  wordSpaces: boolean
  typeInitialsOnly: boolean
  active: boolean
  onSpeak: (text: string) => void
  onFlip: () => void
  onRevealInPlace: () => void
  onHideInPlace: () => void
  onChangeMode: () => void
  onOpenGear: () => void
  registerMechanic?: (handlers: MechanicHandlers | null) => void
}

const stopPress = (event: ReactPointerEvent) => event.stopPropagation()

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
  mode: StudyMode
  onChangeMode: () => void
  onOpenGear: () => void
  back?: boolean
  align?: 'center' | 'start'
  footer?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)

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
        'absolute inset-0 flex flex-col rounded-card-featured bg-card-glass shadow-elevated backface-hidden',
        back && 'transform-[rotateY(180deg)]',
      )}
      inert={!active}
    >
      <header className="flex h-9 shrink-0 touch-none items-center justify-end gap-1.5 px-4 pt-2.5">
        {flagged ? (
          <Flag className="size-4 fill-rating text-(--rating-edge)" aria-hidden />
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

      <footer className="flex min-h-13 shrink-0 touch-none items-center justify-between gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5">
        <ModeButton mode={mode} onClick={onChangeMode} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
          {footer}
        </div>
        <GearButton onClick={onOpenGear} />
      </footer>
    </div>
  )
}

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
      <Icon className="size-4.5" aria-hidden />
    </button>
  )
}

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
      <SlidersHorizontal className="size-4.5" aria-hidden />
    </button>
  )
}

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

function SolvedBadge() {
  const { t } = useTranslation()
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className="inline-flex items-center gap-1.5 rounded-pill bg-(--success-surface) px-3 py-1 text-(length:--p-text-label) font-bold text-(--success-on-surface)"
    >
      <Check className="size-3.5" aria-hidden />
      {t('study.solvedTapToSee')}
    </motion.span>
  )
}

function TipRow({ tip }: { tip: string }) {
  const { t } = useTranslation()
  const [peek, setPeek] = useState(false)
  return (
    <div className="flex min-h-8 shrink-0 items-center justify-center">
      {peek ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[36ch] text-pretty text-(length:--p-text-label) italic text-muted-foreground"
        >
          {tip}
        </motion.p>
      ) : (
        <button
          type="button"
          onPointerDown={stopPress}
          onClick={() => setPeek(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--warning-surface) px-3 py-1.5 text-(length:--p-text-label) font-semibold text-(--warning-foreground)"
        >
          <Lightbulb className="size-3.5" aria-hidden />
          {t('study.peekHint')}
        </button>
      )}
    </div>
  )
}

function HintCard({ hint }: { hint: string }) {
  const { t } = useTranslation()
  return (
    <div className="w-full rounded-card bg-secondary/20 p-4 text-left">
      <div className="mb-1.5 flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-heading" aria-hidden />
        <p className="text-(length:--p-text-label) font-semibold text-heading">
          {t('study.whereToPicture')}
        </p>
      </div>
      <p className="text-(length:--p-text-label) italic leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}

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

function BackPrompt({ prompt, onFlip }: { prompt: string; onFlip: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <FlipZone label={t('study.showFront')} onFlip={onFlip} className="shrink-0">
        <span className="block truncate text-center text-(length:--p-text-label) font-semibold text-accent">
          {prompt}
        </span>
      </FlipZone>
      <div className="mx-auto h-px w-24 shrink-0 bg-border" aria-hidden />
    </>
  )
}

function isAutoToken(token: string): boolean {
  return isReferenceMarker(token) || wordInitial(token).initial === ''
}

export function PromptFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, canSpeak, active, onSpeak, onFlip } = props
  return (
    <CardFace
      flagged={card.card.flagged}
      canSpeak={canSpeak}
      speakText={prompt}
      onSpeak={onSpeak}
      active={active}
      mode={props.mode}
      onChangeMode={props.onChangeMode}
      onOpenGear={props.onOpenGear}
    >
      <h2 className="text-balance wrap-break-word text-center text-[clamp(22px,6vw,28px)] font-bold leading-[1.15] tracking-[-0.01em] text-heading">
        {prompt}
      </h2>
      {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
      <FlipZone label={t('study.showAnswer')} onFlip={onFlip} className="mx-auto w-fit">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info-surface px-3.5 py-1.5 text-(length:--p-text-label) font-medium text-muted-foreground">
          {t('study.tapToReveal')}
        </span>
      </FlipZone>
    </CardFace>
  )
}

export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, typeInitialsOnly, active, onSpeak } = props
  const [fullValue, setFullValue] = useState('')
  const initials = useInitialsRecall(answer, typeInitialsOnly, props.onRevealInPlace)
  const fullResult = typedRecallStatus(answer, fullValue)
  const solved = typeInitialsOnly ? initials.complete : fullResult.complete

  useEffect(() => {
    if (!typeInitialsOnly && fullResult.complete) props.onRevealInPlace()
  }, [typeInitialsOnly, fullResult.complete])

  const resetType = () => {
    if (typeInitialsOnly) initials.reset()
    else setFullValue('')
    props.onHideInPlace()
  }

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
      flagged={card.card.flagged}
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
        <h2 className="text-balance wrap-break-word text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
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
      <textarea
        value={value}
        onPointerDown={stopPress}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('study.typePlaceholder')}
        aria-label={t('study.typePlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-23 w-full flex-1 resize-none rounded-card border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      />

      {result.typed.length > 0 ? (
        <div className="relative max-h-44 shrink-0 overflow-y-auto scrollbar-hide rounded-card bg-info-surface py-3 pl-4 pr-11">
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-(length:--p-text-body) font-medium leading-relaxed">
            {result.statuses.map((status, i) => {
              if (status === 'pending') return null
              if (status === 'correct') {
                return (
                  <span key={i} className="text-(--success-foreground)">
                    {expected[i]}
                  </span>
                )
              }
              return (
                <span key={i} className="inline-flex items-baseline gap-1">
                  <span className="rounded-md bg-(--danger-surface) px-1 text-(--danger-on-surface) line-through decoration-2">
                    {result.typed[i]}
                  </span>
                  <span className="rounded-md bg-(--warning-surface) px-1 font-semibold text-(--warning-foreground)">
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

interface InitialsRecall {
  tokens: string[]
  accepted: number
  typedCount: number
  complete: boolean
  wrong: { char: string; seq: number } | null
  nextWord: () => void
  handleInput: (raw: string) => void
  reset: () => void
}

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
  }, [enabled, complete])

  const flashWrong = (char: string) => {
    seq.current += 1
    setWrong({ char, seq: seq.current })
    window.clearTimeout(wrongTimer.current)
    wrongTimer.current = window.setTimeout(() => setWrong(null), WRONG_LETTER_MS)
  }

  const nextWord = () =>
    setAccepted((prev) => (prev < tokens.length ? advanceAuto(prev + 1) : prev))

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
        className="relative flex min-h-23 flex-1 cursor-text flex-col rounded-card bg-info-surface transition-shadow focus-within:ring-2 focus-within:ring-primary/30"
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
            <p className="text-(length:--p-text-body) text-muted-foreground">
              {t('study.initialsPlaceholder')}
            </p>
          ) : null}
          {accepted > 0 ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-(length:--p-text-body) font-medium leading-relaxed">
              {tokens.slice(0, accepted).map((token, i) => (
                <span
                  key={i}
                  className={
                    isReferenceMarker(token)
                      ? 'font-bold text-accent'
                      : 'text-(--success-foreground)'
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
                className="grid h-16 w-14 place-items-center rounded-card bg-destructive text-[26px] font-bold text-white shadow-elevated"
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

  const reset = () => {
    setUsedKeys(new Set())
    setWrongKey(null)
    props.onHideInPlace()
  }

  useSwipeMechanic(active, props.registerMechanic, { reset })

  const footer = <AidButton label={t('study.reset')} onClick={reset} />

  return (
    <CardFace
      flagged={card.card.flagged}
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
        <h2 className="text-balance wrap-break-word text-[clamp(18px,5vw,22px)] font-bold leading-tight tracking-[-0.01em] text-heading">
          {prompt}
        </h2>
        {card.card.tip ? <TipRow tip={card.card.tip} /> : null}
      </div>
      <div className="h-px shrink-0 bg-border" aria-hidden />

      {done ? (
        <div className="flex shrink-0 justify-center">
          <SolvedBadge />
        </div>
      ) : null}

      <p className="min-h-8 shrink-0 text-balance text-center text-[clamp(16px,4.4vw,20px)] font-semibold leading-relaxed text-heading">
        {placed === 0 ? (
          <span className="text-(length:--p-text-body) font-medium text-muted-foreground">
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
                'rounded-full px-3.5 py-2 text-(length:--p-text-sub) font-semibold transition-colors',
                used
                  ? 'bg-info-surface text-muted-foreground opacity-40'
                  : isWrong
                    ? 'bg-(--danger-surface) text-(--danger-on-surface) ring-2 ring-destructive'
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

export function AnswerFace(props: FaceProps) {
  const { card, prompt, answer, canSpeak, active, onSpeak } = props
  return (
    <CardFace
      flagged={card.card.flagged}
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
      <p className="allow-select text-balance wrap-break-word text-center text-[clamp(17px,4.6vw,21px)] font-semibold leading-relaxed text-heading">
        {answer}
      </p>
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

const BLUR_BATCH = 3

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

  const footer = (
    <>
      <AidButton label={t('study.blur')} onClick={hideMore} />
      <AidButton label={t('study.showAll')} onClick={() => setHidden(new Set())} />
    </>
  )

  return (
    <CardFace
      flagged={card.card.flagged}
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
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}

interface PeekPosition {
  index: number
  x: number
  top: number
  below: boolean
}

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

  const footer = (
    <AidButton
      label={showAll ? t('study.showInitials') : t('study.showWords')}
      onClick={toggleWords}
    />
  )

  return (
    <CardFace
      flagged={card.card.flagged}
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
                initial={
                  reduce ? { opacity: 0 } : { opacity: 0, y: peek.below ? -6 : 6, scale: 0.9 }
                }
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                className="block whitespace-nowrap rounded-control bg-primary px-2.5 py-1.5 text-(length:--p-text-sub) font-semibold text-primary-foreground shadow-interactive"
              >
                {tokens[peek.index]}
              </motion.span>
            </span>
          ) : null}
        </AnimatePresence>
      </div>
      {card.card.hint ? <HintCard hint={card.card.hint} /> : null}
    </CardFace>
  )
}
