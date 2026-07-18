import { generatePath, useNavigate } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import { DeckLibraryPage } from './deck-library-page'

/**
 * Thin routed wrapper: binds the page's navigation intents to real routes. Only `onOpenDeck` and
 * `onOpenArchived` are wired today — `/decks/:deckId`, `/profile`, `/notifications`, `/streak` and
 * the paste-import flow don't have pages yet (later phases), and `DeckLibraryPage` already
 * degrades gracefully when those callbacks are absent (main's own `?? noop` / `?.()` pattern).
 */
export default function DeckLibraryRoute() {
  const navigate = useNavigate()

  return (
    <DeckLibraryPage
      onOpenDeck={(deckId) => void navigate(generatePath(ROUTES.deckDetail, { deckId }))}
      onOpenArchived={() => void navigate(ROUTES.archived)}
    />
  )
}
