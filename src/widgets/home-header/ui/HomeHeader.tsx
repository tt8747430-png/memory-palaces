import { useTranslation } from 'react-i18next'
import { Archive, Flame } from 'lucide-react'
import { cn, levelFromXp } from '@/shared/lib'
import { Avatar, HeaderBar, IconButton, NotificationBell, Progress } from '@/shared/ui'

export interface HomeHeaderProps {
  name: string
  avatar?: string | null
  xp: number
  unreadCount: number
  onOpenProfile: () => void
  onOpenNotifications: () => void
  onOpenArchived?: () => void
  streak?: { count: number; dayCount: number; dailyGoal: number }
  onOpenStreak?: () => void
}

function greetingKey(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour >= 5 && hour < 12) return 'greetingMorning'
  if (hour >= 12 && hour < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

export function HomeHeader({
  name,
  avatar,
  xp,
  unreadCount,
  onOpenProfile,
  onOpenNotifications,
  onOpenArchived,
  streak,
  onOpenStreak,
}: HomeHeaderProps) {
  const { t } = useTranslation()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round(Math.max(0, Math.min(1, xpInLevel / xpForNextLevel)) * 100)
  const xpToNext = t('home.xpToNext', { remaining: xpForNextLevel - xpInLevel, next: level + 1 })

  return (
    <HeaderBar>
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label={`${name} — ${t('home.level', { level })}, ${xpToNext}. ${t('home.openProfile')}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition-transform active:scale-[0.98]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[color:var(--border-glass)] bg-card-glass shadow-rest">
          <Avatar name={name} src={avatar} className="size-11 text-[length:var(--p-text-sub)]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[length:var(--p-text-sub)] font-bold leading-tight tracking-tight text-heading">
            {t(`home.${greetingKey(new Date().getHours())}`)}
          </span>
          <span className="flex items-center gap-2">
            <span className="shrink-0 text-[length:var(--p-text-label)] font-semibold text-primary">
              {t('home.level', { level })}
            </span>
            <Progress
              value={fill}
              className="h-1.5 w-full max-w-[140px] bg-secondary/40"
              label={xpToNext}
            />
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {streak && onOpenStreak ? (
          <StreakButton streak={streak} onOpenStreak={onOpenStreak} />
        ) : null}
        <NotificationBell
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
        {onOpenArchived ? (
          <IconButton variant="glass" aria-label={t('home.archive')} onClick={onOpenArchived}>
            <Archive className="size-5" aria-hidden />
          </IconButton>
        ) : null}
      </div>
    </HeaderBar>
  )
}

function StreakButton({
  streak,
  onOpenStreak,
}: {
  streak: { count: number; dayCount: number; dailyGoal: number }
  onOpenStreak: () => void
}) {
  const { t } = useTranslation()
  const active = streak.dayCount >= streak.dailyGoal
  return (
    <button
      type="button"
      onClick={onOpenStreak}
      aria-label={t('home.streakAria', {
        count: streak.count,
        done: streak.dayCount,
        goal: streak.dailyGoal,
      })}
      className="inline-flex h-11 shrink-0 items-center gap-1 rounded-control bg-card-glass px-2.5 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest transition-transform active:scale-95"
    >
      <Flame
        className={cn('size-4', active ? 'text-[var(--warning)]' : 'text-muted-foreground')}
        fill={active ? 'currentColor' : 'none'}
        aria-hidden
      />
      <span className="tabular-nums">{streak.count}</span>
    </button>
  )
}
