import { useNavigate, useSearch } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { validateBibleImportSearch } from '../manifest'
import { BibleImportPage } from './BibleImportPage'

export function BibleImportScreen() {
  // Read through the manifest's own validator, so the route and the reader cannot drift. The
  // core `useRouteSearch` lives in `app`, which an extension may not import.
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const { deckId } = validateBibleImportSearch(search)
  const navigate = useNavigate()
  return (
    <BibleImportPage
      deckId={deckId}
      onBack={() => void navigate({ to: ROUTES.home })}
      onReview={(reviewIn) =>
        void navigate({ to: ROUTES.deckImport, params: { deckId: reviewIn }, replace: true })
      }
      onShowDeck={(held) => void navigate({ to: ROUTES.deckDetail, params: { deckId: held } })}
    />
  )
}
