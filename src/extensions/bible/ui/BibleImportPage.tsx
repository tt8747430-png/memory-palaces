import { AppScreen, ScreenHeader } from '@/shared/ui'
import { useBibleT } from '../i18n/use-bible-t'

export function BibleImportScreen() {
  const t = useBibleT()
  return (
    <AppScreen header={<ScreenHeader title={t('importTitle')} />}>
      <p className="mt-6 text-body text-muted-foreground">{t('empty')}</p>
    </AppScreen>
  )
}
