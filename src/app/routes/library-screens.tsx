import { useNavigate } from '@tanstack/react-router'
import { ArchivedDecksPage } from '@/pages/archived-decks'
import { DeckLibraryPage } from '@/pages/deck-library'
import { NotificationsPage } from '@/pages/notifications'
import { ROUTES } from '@/shared/config/routes'
import { useBack, useBackTo } from './use-back'

/**
 * The library, scoped either to the unfiled root (home) or to one folder. A folder is its own
 * route rather than a mode of home, so it behaves like the page it looks like: the tab bar steps
 * aside, the back gesture leaves the folder instead of the app, and the folder survives a reload.
 */
export function LibraryScreen({ folderId }: { folderId: string | null }) {
  const navigate = useNavigate()
  const leaveFolder = useBack(() => void navigate({ to: ROUTES.home }))
  return (
    <DeckLibraryPage
      folderId={folderId}
      onOpenFolder={(id) => navigate({ to: ROUTES.folder, params: { folderId: id } })}
      onCloseFolder={leaveFolder}
      // The folder this route names is gone (deleted from inside it, or a stale link). Replace
      // rather than pop: there may be no history to pop back to.
      onFolderGone={() => navigate({ to: ROUTES.home, replace: true })}
      onOpenDeck={(deckId) => navigate({ to: ROUTES.deckDetail, params: { deckId } })}
      onOpenDeckSettings={(deckId) => navigate({ to: ROUTES.deckSettings, params: { deckId } })}
      onImportPaste={() => navigate({ to: ROUTES.newPaste })}
      onReviewDeck={(deckId) => navigate({ to: ROUTES.deckImport, params: { deckId } })}
      onOpenProfile={() => navigate({ to: ROUTES.profile })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onOpenStreak={() => navigate({ to: ROUTES.streak })}
      onOpenArchived={() => navigate({ to: ROUTES.archived })}
    />
  )
}

export function HomeScreen() {
  return <LibraryScreen folderId={null} />
}

export function ArchivedScreen() {
  return <ArchivedDecksPage onBack={useBackTo(ROUTES.home)} />
}

export function NotificationsScreen() {
  return <NotificationsPage onBack={useBackTo(ROUTES.home)} />
}
