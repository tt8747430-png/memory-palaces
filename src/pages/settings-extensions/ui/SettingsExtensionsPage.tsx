import { useTranslation } from 'react-i18next'
import { Wrench } from 'lucide-react'
import { toast } from 'sonner'
import {
  isExtensionEnabled,
  selectEffectivePreferences,
  usePreferencesStore,
  usePreferencesStoreApi,
} from '@/entities/preferences'
import { setExtensionEnabled } from '@/features/preferences'
import {
  cn,
  type ExtensionManifest,
  selectIsReady,
  useContributedT,
  useDevMode,
} from '@/shared/lib'
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
  /** The id a route guard sent the learner here for, so the row can say which one they wanted. */
  highlight?: string
  /** Opens an extension's admin screen. The path comes from the manifest — no core file names it. */
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
  const devMode = useDevMode()
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
              const enabled = isExtensionEnabled(prefs, manifest.id)
              const admin = manifest.admin
              return (
                <div
                  key={manifest.id}
                  data-highlighted={manifest.id === highlight ? '' : undefined}
                  className={cn(manifest.id === highlight && 'bg-info-surface')}
                >
                  <SettingsRow
                    kind="toggle"
                    icon={manifest.icon}
                    label={contributed(manifest.labelKey)}
                    description={contributed(manifest.descriptionKey)}
                    checked={enabled}
                    onCheckedChange={(value) => toggle(manifest.id, value)}
                  />
                  {admin && enabled && devMode ? (
                    <SettingsRow
                      kind="nav"
                      icon={<Wrench />}
                      label={contributed(admin.labelKey)}
                      onClick={() => onOpenExtension?.(admin.route.path)}
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
