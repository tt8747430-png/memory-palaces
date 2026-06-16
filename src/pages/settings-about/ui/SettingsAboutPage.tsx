import { useTranslation } from 'react-i18next'
import { Brain, Info, Wrench } from 'lucide-react'
import { AppScreen, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

/** About — app identity, version/build, and credits. Static content. */
export function SettingsAboutPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('settings.aboutScreen.title')}
        onBack={onBack}
        backLabel={t('settings.back')}
      />

      <div className="mt-4 flex flex-col gap-6 pb-28">
        <div className="flex flex-col items-center gap-3 pt-4 text-center">
          <span
            className="grid size-16 place-items-center rounded-card-featured text-primary-foreground shadow-featured"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
          >
            <Brain className="size-8" aria-hidden />
          </span>
          <div>
            <p className="text-[length:var(--p-text-headline)] font-semibold text-heading">
              Mindscape
            </p>
            <p className="text-[length:var(--p-text-sub)] text-muted-foreground">
              {t('settings.aboutScreen.tagline')}
            </p>
          </div>
        </div>

        <SettingsSection>
          <SettingsRow
            kind="value"
            icon={<Info />}
            label={t('settings.aboutScreen.version')}
            value={t('settings.aboutScreen.versionValue')}
          />
          <SettingsRow
            kind="value"
            icon={<Wrench />}
            label={t('settings.aboutScreen.build')}
            value={t('settings.aboutScreen.buildValue')}
          />
        </SettingsSection>

        <p className="px-1 text-center text-[length:var(--p-text-label)] text-muted-foreground">
          {t('settings.aboutScreen.credits')}
        </p>
      </div>
    </AppScreen>
  )
}
