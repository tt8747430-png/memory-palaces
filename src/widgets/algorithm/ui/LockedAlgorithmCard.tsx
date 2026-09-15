import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { AlgorithmCardFrame } from './AlgorithmCardFrame'
import { AlgorithmLockedNotice } from './AlgorithmLockedNotice'

export interface LockedAlgorithmCardProps {
  algorithm: LearningAlgorithm
}

export function LockedAlgorithmCard({ algorithm }: LockedAlgorithmCardProps) {
  const { t } = useTranslation()
  return (
    <AlgorithmLockedNotice
      trigger={
        <AlgorithmCardFrame
          algorithm={algorithm}
          hint={t('algorithm.locked.rowHint')}
          variant="locked"
        />
      }
    />
  )
}
