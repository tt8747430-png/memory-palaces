import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { StreakSummary } from '@/widgets/streak-summary'
import { AppScreen, Button } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
}

export function HomePage({ onStartReview }: HomePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const status = useSessionStore((state) => state.status)
  const progressStore = useProgressStoreApi()
  const progress = useProgressStore(selectProgress)

  useEffect(() => {
    progressStore.getState().start()
  }, [progressStore])

  const name = session?.displayName ?? 'Guest'
  const greeting =
    session?.kind === 'account' ? t('home.greeting', { name }) : t('home.greetingGuest', { name })

  return (
    <AppScreen className="pt-safe">
      <header className="pt-12">
        <h1 className="text-balance">{greeting}</h1>
        <p className="mt-3 max-w-[60ch]">{t('home.subtitle')}</p>
      </header>

      <StreakSummary
        className="mt-8"
        xp={progress?.xp ?? 0}
        streakCount={progress?.streakCount ?? 0}
        longestStreak={progress?.longestStreak ?? 0}
        trainingDays={progress?.trainingDays ?? []}
      />

      <div className="mt-auto pb-28 pt-10">
        <Button
          size="lg"
          className="w-full"
          disabled={status !== 'ready'}
          onClick={onStartReview}
        >
          {t('home.primaryCta')}
        </Button>
      </div>
    </AppScreen>
  )
}
