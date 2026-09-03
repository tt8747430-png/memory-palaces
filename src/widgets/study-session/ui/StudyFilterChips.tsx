import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { cn } from '@/shared/lib'
import { pillSurface } from '@/shared/ui'
import { type StudyFilter, type StudyFilterCounts, studyFiltersEqual } from '@/features/review'

export interface StudyFilterChipsProps {
  algorithm: LearningAlgorithm
  counts: StudyFilterCounts
  value: StudyFilter
  onPick: (filter: StudyFilter) => void
}

/**
 * Which of the deck's cards this study session runs over. A kind with nothing in it is not offered
 * — except All, which has to stay reachable as the way back from an emptied filter.
 */
export function StudyFilterChips({ algorithm, counts, value, onPick }: StudyFilterChipsProps) {
  const { t } = useTranslation()

  // Fast review schedules nothing, so "due" would name a state no card in the study session can be
  // in.
  const kinds =
    algorithm === 'fast'
      ? (['all', 'new', 'learning', 'flagged'] as const)
      : (['all', 'due', 'new', 'learning', 'flagged'] as const)

  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((kind) => {
        const count = counts[kind]
        if (kind !== 'all' && count === 0) return null
        const candidate: StudyFilter = { kind }
        return (
          <FilterChip
            key={kind}
            label={t(`study.filter${kind[0]!.toUpperCase()}${kind.slice(1)}` as never)}
            count={count}
            active={studyFiltersEqual(value, candidate)}
            onClick={() => onPick(candidate)}
          />
        )
      })}
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        pillSurface(active ? 'primary' : 'info'),
        'transition-transform active:scale-[0.94]',
      )}
    >
      {label}
      <span
        className={cn(
          'text-(length:--p-text-tiny) font-bold',
          active ? 'opacity-70' : 'opacity-60',
        )}
      >
        {count}
      </span>
    </button>
  )
}
