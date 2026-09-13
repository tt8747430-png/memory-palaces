import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { AlgorithmCardFrame } from './AlgorithmCardFrame'

export interface AlgorithmCardProps {
  algorithm: LearningAlgorithm
  onClick?: () => void
}

/**
 * The deck's algorithm, as a row you can press to change it. Deck settings and the algorithm screen
 * both lead with it. A subdeck, whose main deck owns the algorithm, gets `LockedAlgorithmCard`.
 */
export function AlgorithmCard({ algorithm, onClick }: AlgorithmCardProps) {
  const { t } = useTranslation()
  return (
    <AlgorithmCardFrame
      algorithm={algorithm}
      hint={t('deckSettings.algorithmRow')}
      variant="open"
      onClick={onClick}
    />
  )
}
