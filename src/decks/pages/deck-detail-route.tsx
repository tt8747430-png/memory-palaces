import { generatePath, useNavigate, useParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { DeckDetailPage } from './deck-detail-page'

/**
 * Thin routed wrapper: binds the hub's navigation intents to real routes. The study, match,
 * card-editor and import destinations are P2/P8 — their paths are wired now and redirect home
 * until those pages land, so the intents never dead-end on the error boundary.
 */
export default function DeckDetailRoute() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(ROUTES.home)

  const go = (route: string, params: Record<string, string> = {}) =>
    void navigate(generatePath(route, { deckId, ...params }), { viewTransition: true })

  return (
    <DeckDetailPage
      deckId={deckId}
      onBack={back}
      onOpenSettings={() => go(ROUTES.deckSettings)}
      onStudy={() => go(ROUTES.deckStudy)}
      onMatch={() => go(ROUTES.deckMatch)}
      onTest={() => go(ROUTES.deckQuestions)}
      onAddCard={() => go(ROUTES.deckCardNew)}
      onEditCard={(cardId) => go(ROUTES.deckCardEdit, { cardId })}
      onPasteNotes={() => go(ROUTES.deckPaste)}
      onReviewImport={() => go(ROUTES.deckImport)}
    />
  )
}
