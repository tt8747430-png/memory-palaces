import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Archive, Bell, BellRing, Flame } from 'lucide-react'
import { cn, levelFromXp, type StickyHeader } from '@/shared/lib'
import { Avatar, IconButton, StickyBar } from '@/shared/ui'

export interface HomeHeaderProps {
  header: StickyHeader
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

const EASE_OUT = [0.22, 1, 0.36, 1] as const

function greetingKey(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour >= 5 && hour < 12) return 'greetingMorning'
  if (hour >= 12 && hour < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

export function HomeHeader({
  header,
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
  const reduce = useReducedMotion()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round(Math.max(0, Math.min(1, xpInLevel / xpForNextLevel)) * 100)
  const xpToNext = t('home.xpToNext', { remaining: xpForNextLevel - xpInLevel, next: level + 1 })

  return (
    <StickyBar elevation={header.elevation} className="min-h-12">
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
            <span
              className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-secondary/40"
              role="img"
              aria-label={xpToNext}
            >
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${fill}%` }}
                transition={{ delay: 0.12, duration: 0.6, ease: EASE_OUT }}
              />
            </span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        {streak && onOpenStreak ? (
          <StreakButton streak={streak} onOpenStreak={onOpenStreak} />
        ) : null}
        <NotificationButton
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
        {onOpenArchived ? (
          <IconButton variant="ghost" aria-label={t('home.archive')} onClick={onOpenArchived}>
            <Archive className="size-5" aria-hidden />
          </IconButton>
        ) : null}
      </div>
    </StickyBar>
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
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[length:var(--p-text-label)] font-semibold text-heading shadow-rest transition-transform active:scale-95"
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

function NotificationButton({
  unreadCount,
  label,
  onClick,
}: {
  unreadCount: number
  label: string
  onClick: () => void
}) {
  const Icon = unreadCount > 0 ? BellRing : Bell
  return (
    <div className="relative shrink-0">
      <IconButton variant="ghost" aria-label={label} onClick={onClick}>
        <Icon className="size-5" aria-hidden />
      </IconButton>
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-[color:var(--surface)]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </div>
  )
}
