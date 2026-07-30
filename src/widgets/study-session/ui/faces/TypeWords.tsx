import { type ReactNode, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn, type RecallSlot, useVirtualKeyboard } from '@/shared/lib'
import { RecallTokens } from './RecallTokens'
import { stopPress } from './types'

const FEEDBACK_TEXT = 'text-(length:--p-text-body) font-medium leading-relaxed'

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

export function TypeWords({ value, onChange, slots, solved, active }: TypeWordsProps) {
  const { t } = useTranslation()
  const ref = useAutoGrow(value)
  const keyboard = useVirtualKeyboard()
  const hasFeedback = slots.some((slot) => slot.kind !== 'pending')
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
  revision: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [revision])

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[220] mx-auto flex max-w-app px-5"
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
