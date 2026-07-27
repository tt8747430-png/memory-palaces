import { useTranslation } from 'react-i18next'
import { HelpCircle, Plus } from 'lucide-react'
import { Button } from '@/shared/ui'

/** A deck with no test questions yet — the only way forward is to write one. */
export function EmptyQuestions({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-card-featured bg-info-surface text-accent">
        <HelpCircle className="size-6" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-balance text-(length:--p-text-sub) font-semibold text-heading">
        {t('questions.emptyTitle')}
      </h3>
      <p className="max-w-[34ch] text-pretty text-(length:--p-text-body) text-muted-foreground">
        {t('questions.emptyHint')}
      </p>
      <Button className="mt-5" onClick={onAdd}>
        <Plus className="size-[18px]" aria-hidden />
        {t('questions.addQuestion')}
      </Button>
    </div>
  )
}
