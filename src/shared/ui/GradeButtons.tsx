import { useTranslation } from 'react-i18next'
import { cn, type Grade, nextIntervalLabel, type SrsState } from '@/shared/lib'

export interface GradeButtonsProps {
  /** The card's current schedule (absent = brand new). */
  srs?: SrsState
  /** Injected clock (epoch ms) so the interval previews are deterministic. */
  now?: number
  onGrade: (grade: Grade) => void
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

/** The four-grade review control (SM-2), each button previewing the interval the
 * grade would schedule (`nextIntervalLabel`). The single way to grade a card. */
export function GradeButtons({ srs, now = Date.now(), onGrade }: GradeButtonsProps) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-4 gap-2">
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
          <span className="text-[length:var(--p-text-label)]">{t(key)}</span>
          <span className="text-[length:var(--p-text-tiny)] opacity-80">
            {nextIntervalLabel(srs, grade, now)}
          </span>
        </button>
      ))}
    </div>
  )
}
