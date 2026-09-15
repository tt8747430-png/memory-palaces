import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { AlgorithmCardFrame } from './AlgorithmCardFrame'

export interface AlgorithmCardProps {
  algorithm: LearningAlgorithm
  onClick?: () => void
}

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
