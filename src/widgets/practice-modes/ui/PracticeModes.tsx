import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { BookOpen, Brain, ChevronRight, Puzzle } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface PracticeModesProps {
  /** Cards in scope — Match needs at least two; Verses needs at least one. */
  cardCount: number
  /** Authored questions in scope — Test needs at least one. */
  questionCount: number
  onVerse?: () => void
  onMatch?: () => void
  onTest?: () => void
}

/** The practice-mode tiles (Verses / Match / Test) shared by the room hub and palace
 * detail. The Study-cards session is the headline above; these are the alternate ways to
 * exercise the same set, scoped to whichever surface renders them. Every mode is available
 * on every palace and room. */
export function PracticeModes({
  cardCount,
  questionCount,
  onVerse,
  onMatch,
  onTest,
}: PracticeModesProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2.5">
      {onVerse ? (
        <ModeTile
          icon={<BookOpen className="size-5" aria-hidden />}
          tint="bg-gradient-to-br from-primary to-accent"
          label={t('practice.verses')}
          sublabel={t('practice.versesSub')}
          onClick={onVerse}
          disabled={cardCount === 0}
        />
      ) : null}
      <ModeTile
        icon={<Puzzle className="size-5" aria-hidden />}
        tint="bg-accent"
        label={t('practice.match')}
        sublabel={t('practice.matchSub')}
        onClick={onMatch}
        disabled={cardCount < 2}
      />
      <ModeTile
        icon={<Brain className="size-5" aria-hidden />}
        tint="bg-primary"
        label={t('practice.test')}
        sublabel={
          questionCount > 0
            ? t(questionCount === 1 ? 'practice.testSubOne' : 'practice.testSubOther', {
                count: questionCount,
              })
            : t('practice.testEmpty')
        }
        onClick={onTest}
        disabled={questionCount === 0}
      />
    </div>
  )
}

function ModeTile({
  icon,
  tint,
  label,
  sublabel,
  onClick,
  disabled,
}: {
  icon: ReactNode
  tint: string
  label: string
  sublabel: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-3.5 text-left shadow-rest',
        'transition-opacity disabled:opacity-45',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-control text-primary-foreground',
          tint,
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[length:var(--p-text-sub)] font-semibold text-heading">
          {label}
        </span>
        <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
          {sublabel}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </motion.button>
  )
}
