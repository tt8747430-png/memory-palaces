import { DevPreviewPage } from '@/pages/dev-preview'
import { ROUTES } from '@/shared/config/routes'
import { useBackTo } from '@/shared/lib'

export function KitchenSinkScreen() {
  return <DevPreviewPage onBack={useBackTo(ROUTES.settings)} />
}
