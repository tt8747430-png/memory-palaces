import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { useRouteSearch } from '@/shared/lib'
import { validateBibleImportSearch } from '../manifest'
import { BibleImportPage } from './BibleImportPage'

export function BibleImportScreen() {
  const { deckId } = useRouteSearch(validateBibleImportSearch)
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
