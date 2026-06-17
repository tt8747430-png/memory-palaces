import { useTranslation } from 'react-i18next'
import { BookOpen, ChevronDown, Mail } from 'lucide-react'
import { AppScreen, ScreenHeader, SettingsSection } from '@/shared/ui'

/** FAQ categories and how many Q&A each holds; the copy lives in i18n. */
const CATEGORIES = [
  { key: 'gettingStarted', items: ['1', '2', '3'] },
  { key: 'learning', items: ['1', '2', '3'] },
  { key: 'account', items: ['1', '2', '3'] },
  { key: 'troubleshooting', items: ['1', '2', '3'] },
] as const

const DOCS_URL = 'https://docs.mindscape.app'

/** Help center — grouped FAQ (native disclosure rows) plus email and docs contacts.
 * Static content; copy lives in i18n. */
export function SettingsHelpPage({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation()

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader title={t('settings.help.title')} onBack={onBack} backLabel={t('settings.back')} />

      <div className="mt-4 flex flex-col gap-6 pb-28">
        <p className="px-1 text-[length:var(--p-text-sub)] text-muted-foreground">
          {t('settings.help.intro')}
        </p>

        {CATEGORIES.map((category) => (
          <SettingsSection
            key={category.key}
            title={t(`settings.help.categories.${category.key}.title`)}
          >
            {category.items.map((item) => (
              <details key={item} className="group px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[length:var(--p-text-sub)] font-semibold text-heading">
                  {t(`settings.help.categories.${category.key}.q${item}`)}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-2 text-[length:var(--p-text-label)] leading-relaxed text-muted-foreground">
                  {t(`settings.help.categories.${category.key}.a${item}`)}
                </p>
              </details>
            ))}
          </SettingsSection>
        ))}

        <div className="rounded-card bg-info-surface p-4">
          <p className="text-[length:var(--p-text-sub)] font-semibold text-info-foreground">
            {t('settings.help.contactTitle')}
          </p>
          <div className="mt-2 flex flex-col gap-2.5">
            <a
              href={`mailto:${t('settings.help.email')}`}
              className="inline-flex items-center gap-2 text-[length:var(--p-text-sub)] font-semibold text-primary"
            >
              <Mail className="size-4" aria-hidden />
              {t('settings.help.emailLabel')}
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[length:var(--p-text-sub)] font-semibold text-primary"
            >
              <BookOpen className="size-4" aria-hidden />
              {t('settings.help.docs')}
            </a>
          </div>
        </div>
      </div>
    </AppScreen>
  )
}
