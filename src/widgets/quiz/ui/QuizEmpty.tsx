import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'
import { Button, Empty } from '@/shared/ui'

export function QuizEmpty({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <Empty
      variant="hero"
      className="mx-auto h-full w-full max-w-app"
      icon={<Brain className="size-8" aria-hidden />}
      title={t('quiz.empty')}
      description={t('quiz.emptyHint')}
      action={<Button onClick={onBack}>{t('quiz.back')}</Button>}
    />
  )
}
