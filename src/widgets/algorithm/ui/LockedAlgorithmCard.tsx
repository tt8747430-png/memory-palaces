import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { AlgorithmCardFrame } from './AlgorithmCardFrame'
import { AlgorithmLockedNotice } from './AlgorithmLockedNotice'

export interface LockedAlgorithmCardProps {
  /** The main deck's algorithm, which the subdeck studies by. */
  algorithm: LearningAlgorithm
}

/**
 * A subdeck's algorithm row: it names its main deck's algorithm and wears a lock instead of a
 * chevron, and a press explains where the setting lives (`AlgorithmLockedNotice`).
 */
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
