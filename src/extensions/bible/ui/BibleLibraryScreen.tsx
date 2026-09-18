import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from '@/shared/lib'
import { BibleLibraryPage } from './BibleLibraryPage'

export function BibleLibraryScreen() {
  return <BibleLibraryPage onBack={useBackTo(ROUTES.settingsExtensions)} />
}
