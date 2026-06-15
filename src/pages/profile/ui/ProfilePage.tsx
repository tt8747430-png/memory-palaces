import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { AppScreen, Avatar, Card, Chip } from '@/shared/ui'

/** Profile tab. A guest identity today; account claim (Phase 9) and real
 * progress/settings land later, surfaced here as "coming soon" rather than absent. */
export function ProfilePage() {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const name = session?.displayName ?? 'Guest'

  return (
    <AppScreen className="pt-safe">
      <header className="flex flex-col items-center pt-16 text-center">
        <Avatar name={name} className="size-20 text-[length:var(--p-text-headline)]" />
        <h1 className="mt-4 text-balance">{name}</h1>
        <p className="mt-1">{t('profile.guest')}</p>
      </header>

      <section className="mt-8 flex flex-col gap-3 pb-28">
        <ComingSoonCard title={t('profile.progressTitle')} hint={t('profile.progressHint')} />
        <ComingSoonCard title={t('profile.settingsTitle')} hint={t('profile.settingsHint')} />
      </section>
    </AppScreen>
  )
}

function ComingSoonCard({ title, hint }: { title: string; hint: string }) {
  const { t } = useTranslation()
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate">{title}</h3>
        <p className="truncate text-[length:var(--p-text-label)]">{hint}</p>
      </div>
      <Chip className="shrink-0">{t('profile.comingSoon')}</Chip>
    </Card>
  )
}
