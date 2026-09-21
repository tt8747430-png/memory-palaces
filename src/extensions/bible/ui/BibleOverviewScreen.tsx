import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from '@/shared/lib'
import { BIBLE_PATHS } from '../ids'
import { BibleOverviewPage } from './BibleOverviewPage'

export function BibleOverviewScreen() {
  const navigate = useNavigate()
  const back = useBackTo(ROUTES.settingsExtensions)
  return (
    <BibleOverviewPage
      onBack={back}
      onOpenDeveloper={() => void navigate({ to: BIBLE_PATHS.developer })}
      onSwitchedOff={() => void navigate({ to: ROUTES.settingsExtensions, replace: true })}
    />
  )
}
