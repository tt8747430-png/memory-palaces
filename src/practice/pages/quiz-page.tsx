import { useTranslation } from 'react-i18next'
import { AppScreen, ScreenHeader } from '@/shared/ui'
import { QuizOptionsDrawer, QuizSession } from '@/practice/ui'
import { useQuizPage } from './use-quiz-page'

export interface QuizPageProps {
  deckId: string
  onBack?: () => void
}

export function QuizPage({ deckId, onBack }: QuizPageProps) {
  const { t } = useTranslation()
  const vm = useQuizPage(deckId, onBack)

  if (!vm.ready) {
    return (
      <AppScreen className="items-center justify-center">
        <span className="size-8 animate-pulse rounded-full bg-secondary" aria-hidden />
      </AppScreen>
    )
  }

  if (!vm.deck) {
    return (
      <AppScreen
        header={
          <ScreenHeader title={t('quiz.notFound')} onBack={onBack} backLabel={t('quiz.back')} />
        }
      />
    )
  }

  return (
    <>
      <QuizSession
        key={deckId}
        questions={vm.questions}
        title={vm.title}
        autoAdvance={vm.autoAdvance}
        onOpenOptions={vm.openOptions}
        onBack={onBack ?? (() => {})}
        onComplete={vm.complete}
      />
      <QuizOptionsDrawer
        open={vm.optionsOpen}
        onClose={vm.closeOptions}
        quizTimer={vm.autoAdvance}
        shuffleQuestions={vm.shuffleQuestions}
        onQuizTimer={vm.setQuizTimer}
        onShuffleQuestions={vm.setShuffleQuestions}
      />
    </>
  )
}
