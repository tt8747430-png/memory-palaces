import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack, useRouteSearch } from '@/shared/lib'
import { validateBibleImportSearch } from '../model/import-search'
import { BibleImportPage } from './BibleImportPage'

export function BibleImportScreen() {
  const { deckId } = useRouteSearch(validateBibleImportSearch)
  const navigate = useNavigate()
  // Back is where the learner came from — the import sheet of a deck or of the library. A cold
  // link has no history, so it falls back to the deck it carries, or home.
  const back = useBack(
    () =>
      void (deckId
        ? navigate({ to: ROUTES.deckDetail, params: { deckId } })
        : navigate({ to: ROUTES.home })),
  )
  return (
    <BibleImportPage
      deckId={deckId}
      onBack={back}
      onReview={(reviewIn) =>
        void navigate({ to: ROUTES.deckImport, params: { deckId: reviewIn }, replace: true })
      }
      onShowDeck={(held) => void navigate({ to: ROUTES.deckDetail, params: { deckId: held } })}
    />
  )
}
