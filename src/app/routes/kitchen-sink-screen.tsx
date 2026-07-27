import { DevPreviewPage } from '@/pages/dev-preview'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from './use-back'

export function KitchenSinkScreen() {
  return <DevPreviewPage onBack={useBackTo(ROUTES.settings)} />
}
