import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from '@/shared/lib'
import { bibleManifest } from '../manifest'
import { BibleOverviewPage } from './BibleOverviewPage'

/** The developer tools are the extension's own route; the overview is the only way in. */
const DEVELOPER_PATH = bibleManifest.routes.find((route) => route.path.endsWith('/developer'))?.path

export function BibleOverviewScreen() {
  const navigate = useNavigate()
  const back = useBackTo(ROUTES.settingsExtensions)
  return (
    <BibleOverviewPage
      onBack={back}
      onOpenDeveloper={DEVELOPER_PATH ? () => void navigate({ to: DEVELOPER_PATH }) : undefined}
      onSwitchedOff={() => void navigate({ to: ROUTES.settingsExtensions, replace: true })}
    />
  )
}
