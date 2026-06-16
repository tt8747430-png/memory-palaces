import { useTranslation } from 'react-i18next'
import { ChevronDown, Mail } from 'lucide-react'
import { AppScreen, ScreenHeader } from '@/shared/ui'

const FAQ_KEYS = ['1', '2', '3', '4'] as const

/** Help center — a short FAQ (native disclosure rows) plus an email contact. Static
 * content; copy lives in i18n. */
export function SettingsHelpPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader title={t('settings.help.title')} onBack={onBack} backLabel={t('settings.back')} />

      <div className="mt-4 flex flex-col gap-5 pb-28">
        <p className="px-1 text-[length:var(--p-text-sub)] text-muted-foreground">
          {t('settings.help.intro')}
        </p>

        <div className="overflow-hidden rounded-card bg-card shadow-rest divide-y divide-border">
          {FAQ_KEYS.map((key) => (
            <details key={key} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[length:var(--p-text-sub)] font-semibold text-heading">
                {t(`settings.help.q${key}`)}
                <ChevronDown
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-2 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
                {t(`settings.help.a${key}`)}
              </p>
            </details>
          ))}
        </div>

        <div className="rounded-card bg-info-surface p-4">
          <p className="text-[length:var(--p-text-sub)] font-semibold text-info-foreground">
            {t('settings.help.contactTitle')}
          </p>
          <a
            href={`mailto:${t('settings.help.email')}`}
            className="mt-2 inline-flex items-center gap-2 text-[length:var(--p-text-sub)] font-semibold text-primary"
          >
            <Mail className="size-4" aria-hidden />
            {t('settings.help.contact')}
          </a>
        </div>
      </div>
    </AppScreen>
  )
}
