import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn, type RecallSlot, useVirtualKeyboard } from '@/shared/lib'
import { RecallTokens } from './RecallTokens'
import { stopPress } from './types'

const FEEDBACK_TEXT = 'text-(length:--p-text-body) font-medium leading-relaxed'

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

export interface TypeWordsProps {
  value: string
  onChange: (value: string) => void
  slots: RecallSlot[]
  solved: boolean
  active: boolean
}

/** Type the whole answer; the feedback marks it up as you go. */
export function TypeWords({ value, onChange, slots, solved, active }: TypeWordsProps) {
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
