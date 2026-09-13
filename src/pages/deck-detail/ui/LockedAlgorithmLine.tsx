import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META, AlgorithmLockedNotice } from '@/widgets/algorithm'
import { AlgorithmLineFrame } from './AlgorithmLineFrame'

export interface LockedAlgorithmLineProps {
  /** The main deck's algorithm, which the subdeck studies by. */
  value: LearningAlgorithm
}

/**
 * A subdeck's algorithm line: its main deck owns the algorithm, so the line names it with a lock and
 * a press explains where to change it instead of opening the picker.
 */
export function LockedAlgorithmLine({ value }: LockedAlgorithmLineProps) {
  const { t } = useTranslation()
  const name = t(ALGORITHM_META[value].nameKey as never)

  return (
    <AlgorithmLockedNotice
      trigger={
        <AlgorithmLineFrame aria-label={t('algorithm.locked.lineLabel', { name })}>
          {name}
          <Lock className="size-3.5" strokeWidth={2.5} aria-hidden />
        </AlgorithmLineFrame>
      }
    />
  )
}
