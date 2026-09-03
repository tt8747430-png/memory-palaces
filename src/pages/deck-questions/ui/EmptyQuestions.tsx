import { useTranslation } from 'react-i18next'
import { HelpCircle, Plus, Upload } from 'lucide-react'
import { Button, Empty } from '@/shared/ui'

export function EmptyQuestions({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  const { t } = useTranslation()
  return (
    <Empty
      icon={<HelpCircle className="size-6" aria-hidden />}
      title={t('questions.emptyTitle')}
      description={t('questions.emptyHint')}
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onImport}>
            <Upload className="size-4.5" aria-hidden />
            {t('questions.transfer.importShort')}
          </Button>
          <Button onClick={onAdd}>
            <Plus className="size-4.5" aria-hidden />
            {t('questions.addQuestion')}
          </Button>
        </div>
      }
    />
  )
}
