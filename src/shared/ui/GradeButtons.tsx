import { useTranslation } from 'react-i18next'
import { cn, type Grade, nextIntervalLabel, type SrsState } from '@/shared/lib'

export interface GradeButtonsProps {
  srs?: SrsState
  now?: number
  onGrade: (grade: Grade) => void
  className?: string
}

const GRADES: { grade: Grade; key: `grade.${Grade}`; tone: string }[] = [
  {
    grade: 'again',
    key: 'grade.again',
    tone: 'bg-[var(--danger-surface)] text-[var(--danger-on-surface)]',
  },
  {
    grade: 'hard',
    key: 'grade.hard',
    tone: 'bg-[var(--warning-surface)] text-[var(--warning-foreground)]',
  },
  { grade: 'good', key: 'grade.good', tone: 'bg-secondary text-secondary-foreground' },
  {
    grade: 'easy',
    key: 'grade.easy',
    tone: 'bg-[var(--success-surface)] text-[var(--success-on-surface)]',
  },
]

export function GradeButtons({ srs, now = Date.now(), onGrade, className }: GradeButtonsProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {GRADES.map(({ grade, key, tone }) => (
        <button
          key={grade}
          type="button"
          onClick={() => onGrade(grade)}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-control px-2 py-2',
            'font-medium transition-transform duration-150 ease-out active:scale-[0.96]',
            'focus-visible:outline-none',
            tone,
          )}
        >
          <span className="text-[length:var(--p-text-label)] font-semibold">{t(key)}</span>
          <span className="text-[length:var(--p-text-tiny)] opacity-80">
            {nextIntervalLabel(srs, grade, now)}
          </span>
        </button>
      ))}
    </div>
  )
}
