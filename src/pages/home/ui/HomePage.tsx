import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { Button } from '@/shared/ui'

export function HomePage() {
  const { t } = useTranslation()
  const session = useSessionStore((s) => s.session)
  const status = useSessionStore((s) => s.status)

  const name = session?.displayName ?? 'Guest'
  const greeting =
    session?.kind === 'account' ? t('home.greeting', { name }) : t('home.greetingGuest', { name })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-safe pb-safe">
      <header className="pt-12">
        <h1 className="text-balance">{greeting}</h1>
        <p className="mt-3 max-w-[60ch]">{t('home.subtitle')}</p>
      </header>

      <section className="mt-8 rounded-card bg-card-glass p-5 shadow-rest">
        <p>{t('home.guestNote')}</p>
      </section>

      <div className="mt-auto pb-8 pt-10">
        <Button size="lg" className="w-full" disabled={status !== 'ready'}>
          {t('home.primaryCta')}
        </Button>
      </div>
    </main>
  )
}
