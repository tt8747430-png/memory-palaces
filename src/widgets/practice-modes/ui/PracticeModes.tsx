import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Brain, ChevronRight, Puzzle } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface PracticeModesProps {
  cardCount: number
  questionCount: number
  onMatch?: () => void
  onTest?: () => void
  alwaysEnableTest?: boolean
}

export function PracticeModes({
  cardCount,
  questionCount,
  onMatch,
  onTest,
  alwaysEnableTest = false,
}: PracticeModesProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2.5">
      <ModeTile
        icon={<Puzzle className="size-5" aria-hidden />}
        label={t('practice.match')}
        sublabel={t('practice.matchSub')}
        onClick={onMatch}
        disabled={cardCount < 2}
      />
      <ModeTile
        icon={<Brain className="size-5" aria-hidden />}
        label={t('practice.test')}
        sublabel={
          questionCount > 0
            ? t(questionCount === 1 ? 'practice.testSubOne' : 'practice.testSubOther', {
                count: questionCount,
              })
            : alwaysEnableTest
              ? t('practice.testManage')
              : t('practice.testEmpty')
        }
        onClick={onTest}
        disabled={!alwaysEnableTest && questionCount === 0}
      />
    </div>
  )
}

function ModeTile({
  icon,
  label,
  sublabel,
  onClick,
  disabled,
}: {
  icon: ReactNode
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
        className="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-(length:--p-text-sub) font-semibold text-heading">{label}</span>
        <span className="block truncate text-(length:--p-text-label) text-muted-foreground">
          {sublabel}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </motion.button>
  )
}
