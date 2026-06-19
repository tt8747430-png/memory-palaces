import { useTranslation } from 'react-i18next'
import { Brain, FileText, Info, Scale, ScrollText, ShieldCheck, Wrench } from 'lucide-react'
import { AppScreen, ScreenHeader, SettingsRow, SettingsSection } from '@/shared/ui'

const LEGAL_LINKS = [
  { key: 'terms', icon: <FileText />, url: 'https://mindscape.app/terms' },
  { key: 'privacyPolicy', icon: <ShieldCheck />, url: 'https://mindscape.app/privacy' },
  { key: 'licenses', icon: <ScrollText />, url: 'https://mindscape.app/licenses' },
] as const

/** About — app identity, version/build/license, legal links, and credits. */
export function SettingsAboutPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()
  const openLink = (url: string) => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t('settings.aboutScreen.title')}
          onBack={onBack}
          backLabel={t('settings.back')}
        />
      }
    >

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
          <SettingsRow
            kind="value"
            icon={<Scale />}
            label={t('settings.aboutScreen.license')}
            value={t('settings.aboutScreen.licenseValue')}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.aboutScreen.legal')}>
          {LEGAL_LINKS.map((link) => (
            <SettingsRow
              key={link.key}
              kind="nav"
              icon={link.icon}
              label={t(`settings.aboutScreen.${link.key}`)}
              onClick={() => openLink(link.url)}
            />
          ))}
        </SettingsSection>

        <div className="px-1 text-center">
          <p className="text-[length:var(--p-text-label)] text-muted-foreground">
            {t('settings.aboutScreen.credits')}
          </p>
          <p className="mt-1 text-[length:var(--p-text-tiny)] text-muted-foreground">
            {t('settings.aboutScreen.copyright')}
          </p>
        </div>
      </div>
    </AppScreen>
  )
}
