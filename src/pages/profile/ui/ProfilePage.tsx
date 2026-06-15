import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { StreakSummary } from '@/widgets/streak-summary'
import { StreakCalendar } from '@/widgets/streak-calendar'
import { AppScreen, Avatar, cardSurface } from '@/shared/ui'

export interface ProfilePageProps {
  /** Open the settings screen; wired by the route wrapper. */
  onOpenSettings?: () => void
}

/** Profile tab. A guest identity today (account claim is Phase 9); progress is now
 * real — level, XP, streak, and the training calendar — and settings opens a real
 * screen. */
export function ProfilePage({ onOpenSettings }: ProfilePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const progressStore = useProgressStoreApi()
  const progress = useProgressStore(selectProgress)
  const name = session?.displayName ?? 'Guest'

  useEffect(() => {
    progressStore.getState().start()
  }, [progressStore])

  return (
    <AppScreen className="pt-safe">
      <header className="flex flex-col items-center pt-16 text-center">
        <Avatar name={name} className="size-20 text-[length:var(--p-text-headline)]" />
        <h1 className="mt-4 text-balance">{name}</h1>
        <p className="mt-1">{t('profile.guest')}</p>
      </header>

      <section className="mt-8 flex flex-col gap-3 pb-28">
        <StreakSummary
          xp={progress?.xp ?? 0}
          streakCount={progress?.streakCount ?? 0}
          longestStreak={progress?.longestStreak ?? 0}
          trainingDays={progress?.trainingDays ?? []}
        />
        <StreakCalendar trainingDays={progress?.trainingDays ?? []} />
        <button
          type="button"
          aria-label={t('settings.openLabel')}
          onClick={onOpenSettings}
          className={cn(
            cardSurface,
            'flex w-full items-center justify-between gap-3 p-4 text-left transition-transform active:scale-[0.99]',
          )}
        >
          <span className="min-w-0">
            <span className="block truncate font-medium text-heading">
              {t('profile.settingsTitle')}
            </span>
            <span className="block truncate text-[length:var(--p-text-label)] text-muted-foreground">
              {t('profile.settingsHint')}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </section>
    </AppScreen>
  )
}
