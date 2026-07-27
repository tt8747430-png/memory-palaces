import { useTranslation } from 'react-i18next'
import { Brain, Play } from 'lucide-react'
import { Button } from '@/shared/ui'

export interface TestLaunchCardProps {
  questionCount: number
  onStartTest: () => void
}

/** The deck's test at a glance: how many questions are ready, and the way into them. */
export function TestLaunchCard({ questionCount, onStartTest }: TestLaunchCardProps) {
  const { t } = useTranslation()
  const ready = questionCount > 0
  return (
    <div className="rounded-card-featured bg-card p-4 shadow-featured">
      <div className="flex items-center gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-control bg-primary text-primary-foreground"
          aria-hidden
        >
          <Brain className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-(length:--p-text-sub) font-bold text-heading">
            {t('questions.testLead')}
          </p>
          <p className="text-(length:--p-text-label) text-muted-foreground">
            {ready
              ? t(questionCount === 1 ? 'questions.testReadyOne' : 'questions.testReadyOther', {
                  count: questionCount,
                })
              : t('questions.testNone')}
          </p>
        </div>
      </div>
      <Button size="lg" className="mt-3.5 w-full" disabled={!ready} onClick={onStartTest}>
        <Play className="size-[18px]" aria-hidden />
        {t('questions.startTest')}
      </Button>
    </div>
  )
}
