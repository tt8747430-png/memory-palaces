import { useNavigate, useParams } from '@tanstack/react-router'
import { ArchivedDecksPage } from '@/pages/archived-decks'
import { DeckLibraryPage } from '@/pages/deck-library'
import { NotificationsPage } from '@/pages/notifications'
import { ROUTES } from '@/shared/config/routes'
import { useBack, useBackTo } from '@/shared/lib'
import { useExtensionNavigate } from './use-extension-navigate'

function Library({ folderId }: { folderId: string | null }) {
  const navigate = useNavigate()
  const extensionNavigate = useExtensionNavigate()
  const leaveFolder = useBack(() => void navigate({ to: ROUTES.home }))
  return (
    <DeckLibraryPage
      folderId={folderId}
      onOpenFolder={(id) => navigate({ to: ROUTES.folder, params: { folderId: id } })}
      onCloseFolder={leaveFolder}
      onFolderGone={() => navigate({ to: ROUTES.home, replace: true })}
      onOpenDeck={(deckId) => navigate({ to: ROUTES.deckDetail, params: { deckId } })}
      onOpenDeckSettings={(deckId) => navigate({ to: ROUTES.deckSettings, params: { deckId } })}
      onImportPaste={() => navigate({ to: ROUTES.newPaste })}
      onExtensionImport={(to) => extensionNavigate(to)}
      onReviewDeck={(deckId) => navigate({ to: ROUTES.deckImport, params: { deckId } })}
      onOpenProfile={() => navigate({ to: ROUTES.profile })}
      onOpenNotifications={() => navigate({ to: ROUTES.notifications })}
      onOpenStreak={() => navigate({ to: ROUTES.streak })}
      onOpenArchived={() => navigate({ to: ROUTES.archived })}
    />
  )
}

export function HomeScreen() {
  return <Library folderId={null} />
}

export function FolderScreen() {
  return <Library folderId={useParams({ from: ROUTES.folder }).folderId} />
}

export function ArchivedScreen() {
  return <ArchivedDecksPage onBack={useBackTo(ROUTES.home)} />
}

export function NotificationsScreen() {
  return <NotificationsPage onBack={useBackTo(ROUTES.home)} />
}
