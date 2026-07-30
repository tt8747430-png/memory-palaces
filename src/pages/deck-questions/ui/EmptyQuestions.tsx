import { useTranslation } from 'react-i18next'
import { HelpCircle, Plus } from 'lucide-react'
import { Button, Empty } from '@/shared/ui'

export function EmptyQuestions({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  return (
    <Empty
      icon={<HelpCircle className="size-6" aria-hidden />}
      title={t('questions.emptyTitle')}
      description={t('questions.emptyHint')}
      action={
        <Button onClick={onAdd}>
          <Plus className="size-4.5" aria-hidden />
          {t('questions.addQuestion')}
        </Button>
      }
    />
  )
}
