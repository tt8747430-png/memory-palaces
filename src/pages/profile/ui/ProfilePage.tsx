import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import { StreakSummary } from '@/widgets/streak-summary'
import { StreakCalendar } from '@/widgets/streak-calendar'
import { AppScreen, Avatar, Card, Chip } from '@/shared/ui'

/** Profile tab. A guest identity today (account claim is Phase 9); progress is now
 * real — level, XP, streak, and the training calendar. Settings stays a "coming
 * soon" card until Phase 8's preferences slice. */
export function ProfilePage() {
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
