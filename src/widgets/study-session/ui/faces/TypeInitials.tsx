import { useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn, isReferenceMarker } from '@/shared/lib'
import type { InitialsRecall } from '../../model/use-initials-recall'
import { stopPress } from './types'

export function TypeInitials({ recall }: { recall: InitialsRecall }) {
  const { t } = useTranslation()
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

      <WrongLetterBubble wrong={wrong} />
      <span aria-live="polite" className="sr-only">
        {wrong ? t('study.wrongLetter', { letter: wrong.char }) : ''}
      </span>
    </div>
  )
}

function WrongLetterBubble({ wrong }: { wrong: InitialsRecall['wrong'] }) {
  const reduce = useReducedMotion()
  return (
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
  )
}
