import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BellRing } from 'lucide-react'
import { useSessionStore } from '@/entities/session'
import { selectProgress, useProgressStore, useProgressStoreApi } from '@/entities/progress'
import {
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import { StreakSummary } from '@/widgets/streak-summary'
import { AppScreen, Button, IconButton } from '@/shared/ui'

export interface HomePageProps {
  /** Start a daily review session; wired by the route wrapper. */
  onStartReview?: () => void
  /** Open the notification history; wired by the route wrapper. */
  onOpenNotifications?: () => void
}

export function HomePage({ onStartReview, onOpenNotifications }: HomePageProps = {}) {
  const { t } = useTranslation()
  const session = useSessionStore((state) => state.session)
  const status = useSessionStore((state) => state.status)
  const progressStore = useProgressStoreApi()
  const progress = useProgressStore(selectProgress)
  const notificationStore = useNotificationStoreApi()
  const unreadCount = useNotificationStore(selectUnreadCount)

  useEffect(() => {
    progressStore.getState().start()
    notificationStore.getState().start()
  }, [progressStore, notificationStore])

  const name = session?.displayName ?? 'Guest'
  const greeting =
    session?.kind === 'account' ? t('home.greeting', { name }) : t('home.greetingGuest', { name })

  return (
    <AppScreen className="pt-safe">
      <header className="flex items-start justify-between gap-3 pt-12">
        <div className="min-w-0">
          <h1 className="text-balance">{greeting}</h1>
          <p className="mt-3 max-w-[60ch]">{t('home.subtitle')}</p>
        </div>
        {onOpenNotifications ? (
          <NotificationBell
            count={unreadCount}
            label={t('notifications.openLabel')}
            onClick={onOpenNotifications}
          />
        ) : null}
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

function NotificationBell({
  count,
  label,
  onClick,
}: {
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <div className="relative shrink-0">
      <IconButton variant="glass" aria-label={label} onClick={onClick}>
        <BellRing className="size-5" aria-hidden />
      </IconButton>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </div>
  )
}
