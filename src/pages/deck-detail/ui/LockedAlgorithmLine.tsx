import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META, AlgorithmLockedNotice } from '@/widgets/algorithm'
import { AlgorithmLineFrame } from './AlgorithmLineFrame'

export interface LockedAlgorithmLineProps {
  value: LearningAlgorithm
}

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
