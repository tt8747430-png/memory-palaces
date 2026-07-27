import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'
import { Button } from '@/shared/ui'

export function QuizEmpty({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid size-16 place-items-center rounded-card-featured bg-info-surface">
        <Brain className="size-8 text-accent" aria-hidden />
      </div>
      <div>
        <h2 className="mb-1 text-(length:--p-text-headline) font-bold text-heading">
          {t('quiz.empty')}
        </h2>
        <p className="mx-auto max-w-[34ch] text-(length:--p-text-body)">{t('quiz.emptyHint')}</p>
      </div>
      <Button onClick={onBack}>{t('quiz.back')}</Button>
    </div>
  )
}
