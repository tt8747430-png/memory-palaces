import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, dayKey } from '@/shared/lib'
import { GlassCard, IconButton } from '@/shared/ui'

export interface StreakCalendarProps {
  /** `YYYY-MM-DD` UTC keys of every day trained. */
  trainingDays: readonly string[]
  now?: number
}

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_MS = 86_400_000
const GRID_CELLS = 42 // 6 weeks

interface MonthCell {
  key: string
  date: number
  inMonth: boolean
  isToday: boolean
  trained: boolean
}

/** Build a 6-week UTC grid for `year`/`month`. UTC throughout so the cell keys
 * line up with how training days are stored (`YYYY-MM-DD` UTC). */
function monthGrid(
  year: number,
  month: number,
  trained: Set<string>,
  todayKey: string,
): MonthCell[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const start = Date.UTC(year, month, 1 - firstWeekday)
  return Array.from({ length: GRID_CELLS }, (_, i) => {
    const date = new Date(start + i * DAY_MS)
    const key = date.toISOString().slice(0, 10)
    return {
      key,
      date: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
      isToday: key === todayKey,
      trained: trained.has(key),
    }
  })
}

/** Month calendar of trained days, navigable by month. The fuller view that pairs
 * with the home week strip; presentational, fed the training days. */
export function StreakCalendar({ trainingDays, now = Date.now() }: StreakCalendarProps) {
  const { t } = useTranslation()
  const todayKey = dayKey(now)
  const [cursor, setCursor] = useState(() => {
    const today = new Date(now)
    return { year: today.getUTCFullYear(), month: today.getUTCMonth() }
  })

  const trained = useMemo(() => new Set(trainingDays), [trainingDays])
  const cells = useMemo(
    () => monthGrid(cursor.year, cursor.month, trained, todayKey),
    [cursor, trained, todayKey],
  )

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const shift = (delta: number) =>
    setCursor((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + delta, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })

  return (
    <GlassCard tone="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[length:var(--p-text-title)] font-semibold text-heading">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <IconButton size="sm" aria-label={t('progress.prevMonth')} onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" aria-hidden />
          </IconButton>
          <IconButton size="sm" aria-label={t('progress.nextMonth')} onClick={() => shift(1)}>
            <ChevronRight className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_INITIALS.map((initial, i) => (
          <span
            key={i}
            className="text-center text-[length:var(--p-text-tiny)] font-semibold text-muted-foreground"
          >
            {initial}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <div
            key={cell.key}
            aria-hidden={!cell.inMonth}
            className={cn(
              'grid aspect-square place-items-center rounded-control text-[length:var(--p-text-label)] font-semibold tabular-nums',
              !cell.inMonth && 'text-transparent',
              cell.inMonth && cell.trained && 'bg-[var(--warning)] text-[var(--warning-on-fill)]',
              cell.inMonth && !cell.trained && 'bg-info-surface text-muted-foreground',
              // Today keeps a navy ring even when trained, so "where you are" never relies on fill alone.
              cell.inMonth && cell.isToday && 'ring-2 ring-inset ring-[color:var(--primary)]',
              cell.inMonth && cell.isToday && !cell.trained && 'text-heading',
            )}
          >
            {cell.date}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-5 text-[length:var(--p-text-tiny)] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[5px] bg-[var(--warning)]" aria-hidden />
          {t('progress.legendTrained')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-3 rounded-[5px] ring-2 ring-inset ring-[color:var(--primary)]"
            aria-hidden
          />
          {t('progress.legendToday')}
        </span>
      </div>
    </GlassCard>
  )
}
