import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { useBack } from '@/shared/lib'
import { bibleManifest } from '../manifest'
import { BibleDeveloperPage } from './BibleDeveloperPage'

/** Reached from the overview and nowhere else, so that is where a cold link goes back to. */
const OVERVIEW_PATH = bibleManifest.overview?.route.path

export function BibleDeveloperScreen() {
  const navigate = useNavigate()
  const back = useBack(
    () => void navigate(OVERVIEW_PATH ? { to: OVERVIEW_PATH } : { to: ROUTES.settingsExtensions }),
  )
  return <BibleDeveloperPage onBack={back} />
}
