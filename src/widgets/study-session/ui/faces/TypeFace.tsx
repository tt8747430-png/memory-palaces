import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import {
  cn,
  isReferenceMarker,
  type RecallSlot,
  typedRecallStatus,
  useVirtualKeyboard,
  withNextWord,
} from '@/shared/lib'
import { useInitialsRecall, type InitialsRecall } from '../../model/use-initials-recall'
import { AidButton, CardFace, TipRow } from './CardFace'
import { type FaceProps, stopPress, useSwipeMechanic } from './types'

export function TypeFace(props: FaceProps) {
  const { t } = useTranslation()
  const { card, prompt, answer, canSpeak, typeInitialsOnly, active, onSpeak } = props
  const [text, setText] = useState('')
  const initials = useInitialsRecall(answer, typeInitialsOnly, props.onRevealInPlace)
  const typed = useMemo(() => typedRecallStatus(answer, text), [answer, text])
  const solved = typeInitialsOnly ? initials.complete : typed.complete

  useEffect(() => {
    if (!typeInitialsOnly && typed.complete) props.onRevealInPlace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeInitialsOnly, typed.complete])

  const reset = () => {
    if (typeInitialsOnly) initials.reset()
    else setText('')
    props.onHideInPlace()
  }

  const nextWord = () => {
    if (typeInitialsOnly) initials.nextWord()
    else setText((prev) => withNextWord(answer, prev))
  }

  const started = typeInitialsOnly ? initials.typedCount > 0 : text.trim().length > 0

  useSwipeMechanic(active, props.registerMechanic, {
    nextWord: solved ? undefined : nextWord,
    reset,
  })

  const footer = solved ? (
    <AidButton label={t('study.reset')} onClick={reset} />
  ) : (
    <>
      <AidButton label={t('study.nextWord')} onClick={nextWord} />
      {started ? <AidButton tone="quiet" label={t('study.reset')} onClick={reset} /> : null}
    </>
  )

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
      {typeInitialsOnly ? (
        <TypeInitials recall={initials} />
      ) : (
        <TypeWords
          value={text}
          onChange={setText}
          slots={typed.slots}
          solved={solved}
          active={active}
        />
      )}
    </CardFace>
  )
}

/**
 * Grows with its content instead of scrolling: the card body is the only scroller, and a
 * textarea that scrolled inside it could neither be panned nor swiped past.
 */
function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

const FEEDBACK_TEXT = 'text-(length:--p-text-body) font-medium leading-relaxed'

function TypeWords({
  value,
  onChange,
  slots,
  solved,
  active,
}: {
  value: string
  onChange: (value: string) => void
  slots: RecallSlot[]
  solved: boolean
  active: boolean
}) {
  const { t } = useTranslation()
  const ref = useAutoGrow(value)
  const keyboard = useVirtualKeyboard()
  const hasFeedback = slots.some((slot) => slot.kind !== 'pending')
  // The feedback rides above the keyboard while typing and settles back inline once it closes —
  // only ever mounted in one place, so scroll position and layout do not fight each other.
  const floats = active && keyboard.open && hasFeedback

  const body = <RecallTokens slots={slots} />

  return (
    <div className="flex flex-col gap-2.5">
      <textarea
        ref={ref}
        value={value}
        readOnly={solved}
        onPointerDown={stopPress}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('study.typePlaceholder')}
        aria-label={t('study.typePlaceholder')}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        rows={1}
        className={cn(
          'min-h-23 w-full resize-none overflow-hidden rounded-card border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          solved && 'border-transparent bg-(--success-surface) text-(--success-on-surface)',
        )}
      />

      {hasFeedback && !floats ? (
        <div
          aria-label={t('study.typeAid')}
          className={cn(
            'rounded-card px-4 py-3',
            FEEDBACK_TEXT,
            solved ? 'bg-(--success-surface)' : 'bg-info-surface',
          )}
        >
          {body}
        </div>
      ) : null}

      {floats ? (
        <FloatingFeedback
          height={keyboard.height}
          solved={solved}
          label={t('study.typeAid')}
          revision={value}
        >
          {body}
        </FloatingFeedback>
      ) : null}
    </div>
  )
}

/**
 * A fixed-height, scrollable feedback panel pinned just above the on-screen keyboard. Its height
 * never tracks its content — a long answer scrolls inside the same box a short one fills, so the
 * panel never grows or shrinks under the typing. Portalled to the body so it escapes the card's
 * flip transform, which would otherwise trap `position: fixed` inside the rotated ancestor.
 */
function FloatingFeedback({
  height,
  solved,
  label,
  revision,
  children,
}: {
  height: number
  solved: boolean
  label: string
  /** Changes whenever the feedback content does, so the box can follow the newest tokens. */
  revision: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the newest tokens in view as the learner types past the fold. Without this the box
  // looks like it stops giving feedback once the answer overflows — the extra words are being
  // written, just below the visible edge.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [revision])

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[220] mx-auto flex max-w-[430px] px-5"
      style={{ bottom: height }}
    >
      <motion.div
        ref={scrollRef}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
        aria-label={label}
        className={cn(
          'pointer-events-auto mb-2 h-44 w-full overflow-y-auto overscroll-contain scrollbar-hide rounded-card px-4 py-3 shadow-elevated',
          FEEDBACK_TEXT,
          solved ? 'bg-(--success-surface)' : 'bg-info-surface',
        )}
      >
        {children}
      </motion.div>
    </div>,
    document.body,
  )
}

function RecallTokens({ slots }: { slots: RecallSlot[] }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5">
      {slots.map((slot, i) => (
        <RecallToken key={i} slot={slot} />
      ))}
    </p>
  )
}

const CORRECT = 'text-(--success-foreground)'
const STRUCK =
  'rounded-md bg-(--danger-surface) px-1 text-(--danger-on-surface) line-through decoration-2'
const EXPECTED = 'rounded-md bg-(--warning-surface) px-1 font-semibold text-(--warning-foreground)'

function RecallToken({ slot }: { slot: RecallSlot }) {
  switch (slot.kind) {
    case 'pending':
      return null
    case 'correct':
      return <span className={CORRECT}>{slot.expected}</span>
    case 'extra':
      return <span className={STRUCK}>{slot.typed}</span>
    case 'missing':
      return (
        <span
          className={cn(EXPECTED, 'underline decoration-dashed decoration-2 underline-offset-2')}
        >
          {slot.expected}
        </span>
      )
    case 'wrong':
      return (
        <span className="inline-flex items-baseline gap-1">
          <span className={STRUCK}>{slot.typed}</span>
          <span className={EXPECTED}>{slot.expected}</span>
        </span>
      )
  }
}

function TypeInitials({ recall }: { recall: InitialsRecall }) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const { tokens, accepted, wrong, complete, handleInput } = recall

  return (
    <div
      data-card-control
      onPointerDown={stopPress}
      onClick={() => inputRef.current?.focus()}
      className={cn(
        'relative flex min-h-23 w-full cursor-text flex-col rounded-card px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-primary/30',
        complete ? 'bg-(--success-surface)' : 'bg-info-surface',
      )}
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

      {complete ? (
        <div className="mb-2 flex items-center gap-1.5 text-(--success-on-surface)">
          <Check className="size-4 shrink-0" aria-hidden />
          <span className="text-(length:--p-text-label) font-semibold">
            {t('study.initialsComplete')}
          </span>
        </div>
      ) : null}

      {accepted === 0 ? (
        <p className="text-(length:--p-text-body) text-muted-foreground">
          {t('study.initialsPlaceholder')}
        </p>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-(length:--p-text-body) font-medium leading-relaxed">
          {tokens.slice(0, accepted).map((token, i) => (
            <span
              key={i}
              className={cn(
                isReferenceMarker(token)
                  ? 'font-bold text-accent'
                  : complete
                    ? 'text-(--success-on-surface)'
                    : 'text-(--success-foreground)',
              )}
            >
              {token}
            </span>
          ))}
        </p>
      )}

      {/* The wrong letter surfaces just below the box — not over the answer text. One bubble stays
          mounted while mistakes keep arriving; only the letter inside swaps, so a run of mistakes
          reads as a smooth replacement instead of a flicker of remounts. */}
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2">
        <AnimatePresence>
          {wrong ? (
            <motion.div
              key="wrong-bubble"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 10 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduce ? 1 : 0.92, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
              aria-hidden
              className="grid h-16 w-14 place-items-center overflow-hidden rounded-card bg-destructive text-[26px] font-bold text-white shadow-elevated"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={wrong.seq}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.13 }}
                >
                  {wrong.char}
                </motion.span>
              </AnimatePresence>
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
