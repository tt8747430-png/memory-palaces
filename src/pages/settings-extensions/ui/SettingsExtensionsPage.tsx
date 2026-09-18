import { useTranslation } from 'react-i18next'
import { Blocks } from 'lucide-react'
import { toast } from 'sonner'
import {
  isExtensionEnabled,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import { cn, type ExtensionManifest, selectIsReady } from '@/shared/lib'
import { AppScreen, ScreenHeader, ScreenLoading, SettingsRow, SettingsSection } from '@/shared/ui'

export interface SettingsExtensionsPageProps {
  manifests: ExtensionManifest[]
  /** The id a route guard sent the reader here for, so the row can say which one they wanted. */
  highlight?: string
  onBack?: () => void
}

/**
 * There is deliberately no offline branch and no error screen. Every toggle is a local write, so
 * the screen works offline and a notice saying otherwise would be a lie; and `StoreStatus` is
 * `idle | loading | ready` (`shared/lib/entity-store.ts`), so a store cannot report an error to
 * render. The one failure this page can have is `save()` rejecting, reported with a toast like
 * every other local write in the app.
 */
export function SettingsExtensionsPage({
  manifests,
  highlight,
  onBack,
}: SettingsExtensionsPageProps) {
  const { t } = useTranslation()
  const ready = usePreferencesStore(selectIsReady)
  const prefs = usePreferencesStore(selectEffectivePreferences)
  const store = usePreferencesStoreApi()

  const toggle = (id: string, value: boolean) => {
    void setExtensionEnabled(store, id, value).catch(() =>
      toast.error(t('settings.extensionsFailed')),
    )
  }

  return (
    <AppScreen
      gutter="end"
      header={
        <ScreenHeader
          title={t('settings.extensions')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >
      <div className="mt-4 flex flex-col gap-5">
        {!ready ? (
          <ScreenLoading />
        ) : manifests.length === 0 ? (
          <p className="rounded-card bg-card p-6 text-center text-body text-muted-foreground shadow-rest">
            {t('settings.extensionsEmpty')}
          </p>
        ) : (
          <SettingsSection title={t('settings.extensionsSection')}>
            {manifests.map((manifest) => (
              <div
                key={manifest.id}
                data-highlighted={manifest.id === highlight ? '' : undefined}
                className={cn(manifest.id === highlight && 'bg-info-surface')}
              >
                <SettingsRow
                  kind="toggle"
                  icon={manifest.icon ?? <Blocks />}
                  label={t(manifest.labelKey as never)}
                  description={t(manifest.descriptionKey as never)}
                  checked={isExtensionEnabled(prefs, manifest.id)}
                  onCheckedChange={(value) => toggle(manifest.id, value)}
                />
              </div>
            ))}
          </SettingsSection>
        )}
      </div>
    </AppScreen>
  )
}
