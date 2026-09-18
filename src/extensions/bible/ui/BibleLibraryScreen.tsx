import { useNavigate } from '@tanstack/react-router'
import { ROUTES } from '@/shared/config/routes'
import { BibleLibraryPage } from './BibleLibraryPage'

export function BibleLibraryScreen() {
  const navigate = useNavigate()
  return <BibleLibraryPage onBack={() => void navigate({ to: ROUTES.settingsExtensions })} />
}
