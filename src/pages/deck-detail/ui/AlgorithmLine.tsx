import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import type { LearningAlgorithm } from '@/entities/deck'
import { ALGORITHM_META, AlgorithmSheet } from '@/widgets/algorithm'
import { Button, Sheet } from '@/shared/ui'

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
  const [aboutOpen, setAboutOpen] = useState(false)
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
        <button
          type="button"
          aria-label={t('algorithm.explain')}
          onClick={() => setAboutOpen(true)}
          className="grid size-5 place-items-center rounded-full text-muted-foreground"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </p>

      <Sheet
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        title={t(meta.longNameKey as never)}
        footer={
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setAboutOpen(false)
              setPickerOpen(true)
            }}
          >
            {t('common.edit')}
          </Button>
        }
      >
        <p className="pb-2 text-(length:--p-text-body) leading-relaxed text-muted-foreground">
          {t(meta.bodyKey as never)}
        </p>
      </Sheet>

      <AlgorithmSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={value}
        onChange={onChange}
      />
    </>
  )
}
