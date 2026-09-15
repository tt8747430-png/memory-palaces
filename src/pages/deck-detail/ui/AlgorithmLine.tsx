import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META, AlgorithmSheet } from '@/widgets/algorithm'
import { AlgorithmLineFrame } from './AlgorithmLineFrame'

export interface AlgorithmLineProps {
  value: LearningAlgorithm
  onChange: (value: LearningAlgorithm) => void
}

export function AlgorithmLine({ value, onChange }: AlgorithmLineProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <AlgorithmLineFrame onClick={() => setOpen(true)}>
        {t(ALGORITHM_META[value].nameKey as never)}
      </AlgorithmLineFrame>
      <AlgorithmSheet open={open} onOpenChange={setOpen} value={value} onChange={onChange} />
    </>
  )
}
