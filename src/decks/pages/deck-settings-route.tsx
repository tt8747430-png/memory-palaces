import { generatePath, useNavigate, useParams } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { DeckSettingsPage } from './deck-settings-page'

/**
 * Thin routed wrapper. A deleted deck has no detail page left to fall back to, so `onDeleted`
 * replaces the history entry with the library rather than going back into a dead route.
 */
export default function DeckSettingsRoute() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(generatePath(ROUTES.deckDetail, { deckId }))

  return (
    <DeckSettingsPage
      deckId={deckId}
      onBack={back}
      onDeleted={() => void navigate(ROUTES.home, { replace: true, viewTransition: true })}
    />
  )
}
