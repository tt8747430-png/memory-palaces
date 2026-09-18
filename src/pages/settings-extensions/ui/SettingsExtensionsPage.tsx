import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  isExtensionEnabled,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import { cn, type ExtensionManifest, selectIsReady, useContributedT } from '@/shared/lib'
import {
  AppScreen,
  EmptyNotice,
  ScreenHeader,
  ScreenLoading,
  SettingsRow,
  SettingsSection,
} from '@/shared/ui'

export interface SettingsExtensionsPageProps {
  manifests: ExtensionManifest[]
  /** The id a route guard sent the reader here for, so the row can say which one they wanted. */
  highlight?: string
  /** The path comes from the manifest — no core file names an extension's screen. */
  onOpenExtension?: (path: string) => void
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
  onOpenExtension,
  onBack,
}: SettingsExtensionsPageProps) {
  const { t } = useTranslation()
  const contributed = useContributedT()
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
          <EmptyNotice>{t('settings.extensionsEmpty')}</EmptyNotice>
        ) : (
          <SettingsSection title={t('settings.extensionsSection')}>
            {manifests.map((manifest) => {
              const label = contributed(manifest.labelKey)
              const detailPath = manifest.detailPath
              return (
                <div
                  key={manifest.id}
                  data-highlighted={manifest.id === highlight ? '' : undefined}
                  className={cn(manifest.id === highlight && 'bg-info-surface')}
                >
                  <SettingsRow
                    kind="toggle"
                    icon={manifest.icon}
                    label={label}
                    description={contributed(manifest.descriptionKey)}
                    checked={isExtensionEnabled(prefs, manifest.id)}
                    onCheckedChange={(value) => toggle(manifest.id, value)}
                  />
                  {detailPath && isExtensionEnabled(prefs, manifest.id) ? (
                    <SettingsRow
                      kind="nav"
                      icon={<ChevronRight />}
                      label={t('settings.extensionsOpen', { name: label })}
                      onClick={() => onOpenExtension?.(detailPath)}
                    />
                  ) : null}
                </div>
              )
            })}
          </SettingsSection>
        )}
      </div>
    </AppScreen>
  )
}
