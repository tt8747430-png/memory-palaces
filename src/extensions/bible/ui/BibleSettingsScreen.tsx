import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from '@/shared/lib'
import { BibleSettingsPage } from './BibleSettingsPage'

export function BibleSettingsScreen() {
  return <BibleSettingsPage onBack={useBackTo(ROUTES.settingsExtensions)} />
}
