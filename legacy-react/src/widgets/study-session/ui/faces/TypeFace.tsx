import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import {
  cn,
  isReferenceMarker,
  type RecallSlot,
  typedRecallStatus,
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
        <TypeWords value={text} onChange={setText} slots={typed.slots} solved={solved} />
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

function TypeWords({
  value,
  onChange,
  slots,
  solved,
}: {
  value: string
  onChange: (value: string) => void
  slots: RecallSlot[]
  solved: boolean
}) {
  const { t } = useTranslation()
  const ref = useAutoGrow(value)
  const marked = slots.filter((slot) => slot.kind !== 'pending')

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

      {marked.length > 0 && !solved ? (
        <div
          aria-label={t('study.typeAid')}
          className="rounded-card bg-info-surface px-4 py-3 text-(length:--p-text-body) font-medium leading-relaxed"
        >
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5">
            {slots.map((slot, i) => (
              <RecallToken key={i} slot={slot} />
            ))}
          </p>
        </div>
      ) : null}
    </div>
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
  const { tokens, accepted, wrong, handleInput } = recall

  return (
    <div
      data-card-control
      onPointerDown={stopPress}
      onClick={() => inputRef.current?.focus()}
      className="relative flex min-h-23 w-full cursor-text flex-col rounded-card bg-info-surface px-4 py-3 transition-shadow focus-within:ring-2 focus-within:ring-primary/30"
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

      {accepted === 0 ? (
        <p className="text-(length:--p-text-body) text-muted-foreground">
          {t('study.initialsPlaceholder')}
        </p>
      ) : (
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1.5 text-(length:--p-text-body) font-medium leading-relaxed">
          {tokens.slice(0, accepted).map((token, i) => (
            <span
              key={i}
              className={
                isReferenceMarker(token) ? 'font-bold text-accent' : 'text-(--success-foreground)'
              }
            >
              {token}
            </span>
          ))}
        </p>
      )}

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
  )
}
