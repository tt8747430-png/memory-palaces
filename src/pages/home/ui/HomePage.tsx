import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { AppScreen, Button, GlassCard } from '@/shared/ui'

export function HomePage() {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const status = useSessionStore((state) => state.status)

  const name = session?.displayName ?? 'Guest'
  const greeting =
    session?.kind === 'account' ? t('home.greeting', { name }) : t('home.greetingGuest', { name })

  return (
    <AppScreen className="pt-safe">
      <header className="pt-12">
        <h1 className="text-balance">{greeting}</h1>
        <p className="mt-3 max-w-[60ch]">{t('home.subtitle')}</p>
      </header>

      <GlassCard tone="sky" className="mt-8">
        <p className="text-foreground">{t('home.guestNote')}</p>
      </GlassCard>

      <div className="mt-auto pb-28 pt-10">
        <Button size="lg" className="w-full" disabled={status !== 'ready'}>
          {t('home.primaryCta')}
        </Button>
      </div>
    </AppScreen>
  )
}
