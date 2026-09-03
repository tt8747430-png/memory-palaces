import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META, AlgorithmSheet } from '@/widgets/algorithm'

export interface AlgorithmLineProps {
  value: LearningAlgorithm
  onChange: (value: LearningAlgorithm) => void
}

/**
 * The deck says out loud which algorithm it follows, because everything else on the screen — the
 * counts, the chips, the footer in the session — reads differently depending on the answer.
 */
export function AlgorithmLine({ value, onChange }: AlgorithmLineProps) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const meta = ALGORITHM_META[value]

  return (
    <>
      <p className="flex flex-wrap items-center gap-1.5 text-(length:--p-text-label) text-muted-foreground">
        <span>{t('algorithm.deckLine')}</span>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-control font-semibold text-accent underline-offset-2 hover:underline"
        >
          {t(meta.nameKey as never)}
        </button>
      </p>

      <AlgorithmSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={value}
        onChange={onChange}
      />
    </>
  )
}
