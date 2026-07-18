import { generatePath, useParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { QuizPage } from './quiz-page'

/**
 * Thin routed wrapper. The deck hub is the canonical parent rather than the questions page the
 * quiz is usually launched from: on a deep link or PWA cold start there is no history to pop,
 * and the hub is the destination that makes sense from either entry point.
 */
export default function QuizRoute() {
  const { deckId = '' } = useParams()
  const back = useBack(generatePath(ROUTES.deckDetail, { deckId }))

  return <QuizPage deckId={deckId} onBack={back} />
}
