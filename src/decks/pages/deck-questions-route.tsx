import { generatePath, useNavigate, useParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { DeckQuestionsPage } from './deck-questions-page'

/**
 * Thin routed wrapper. The question editor (P8) and the quiz (P2) are not built yet — their
 * paths are wired now and redirect home until they land.
 */
export default function DeckQuestionsRoute() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(generatePath(ROUTES.deckDetail, { deckId }))

  const go = (route: string, params: Record<string, string> = {}) =>
    void navigate(generatePath(route, { deckId, ...params }), { viewTransition: true })

  return (
    <DeckQuestionsPage
      deckId={deckId}
      onBack={back}
      onAddQuestion={() => go(ROUTES.deckQuestionNew)}
      onEditQuestion={(questionId) => go(ROUTES.deckQuestionEdit, { questionId })}
      onStartTest={() => go(ROUTES.deckQuiz)}
    />
  )
}
