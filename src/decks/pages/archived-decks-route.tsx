import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { ArchivedDecksPage } from './archived-decks-page'

/** Thin routed wrapper: the archive is only ever reached from the library. */
export default function ArchivedDecksRoute() {
  const back = useBack(ROUTES.home)

  return <ArchivedDecksPage onBack={back} />
}
