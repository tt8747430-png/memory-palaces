import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Archive, Bell, BellRing, Flame, Search, X } from 'lucide-react'
import { cn, levelFromXp, type StickyHeader } from '@/shared/lib'
import { Avatar, IconButton, StickyBar, TextField } from '@/shared/ui'

/** Inline search wiring for the landing header. When `open`, the header swaps its identity
 * row for a full-width search field. */
export interface HomeHeaderSearch {
  open: boolean
  query: string
  onOpen: () => void
  onClose: () => void
  onQueryChange: (value: string) => void
  label: string
  placeholder: string
  closeLabel: string
}

export interface HomeHeaderProps {
  /** Elevation state, owned by the page so its scroll container drives it. */
  header: StickyHeader
  name: string
  /** The user's photo, or null/undefined to fall back to gradient initials. */
  avatar?: string | null
  /** Raw XP — the bar derives the level + progress from it. */
  xp: number
  unreadCount: number
  onOpenProfile: () => void
  onOpenNotifications: () => void
  /** Jump to the archived-palaces view; omit to hide the archive control. */
  onOpenArchived?: () => void
  /** Optional inline search; when provided, a search button joins the bell and can take
   * over the whole bar. Omit it for surfaces that don't search. */
  search?: HomeHeaderSearch
  /** Live streak count + today's progress toward the goal; omit to hide the flame. */
  streak?: { count: number; dayCount: number; dailyGoal: number }
  onOpenStreak?: () => void
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Time-of-day greeting key. Short, fixed strings that never elide — the home bar leads with
 * this instead of the user's (arbitrarily long) name, which the avatar + aria-label still carry. */
function greetingKey(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour >= 5 && hour < 12) return 'greetingMorning'
  if (hour >= 12 && hour < 18) return 'greetingAfternoon'
  return 'greetingEvening'
}

/** The home's chrome: one slim, calm bar of a fixed height. A time-of-day greeting sits over a
 * `Level N` line and a thin XP-to-next progress bar; the glassy framed avatar taps through to
 * the profile. The right cluster carries the day's quick chrome — streak, archive, search,
 * notifications. The bar is transparent at the top (merging into the daylight ground) and gains
 * a glass edge as the page scrolls under it. */
export function HomeHeader({
  header,
  name,
  avatar,
  xp,
  unreadCount,
  onOpenProfile,
  onOpenNotifications,
  onOpenArchived,
  search,
  streak,
  onOpenStreak,
}: HomeHeaderProps) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round(Math.max(0, Math.min(1, xpInLevel / xpForNextLevel)) * 100)
  const xpToNext = t('home.xpToNext', { remaining: xpForNextLevel - xpInLevel, next: level + 1 })

  if (search?.open) {
    return (
      <StickyBar elevation={header.elevation} className="min-h-12">
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <TextField
              aria-label={search.label}
              placeholder={search.placeholder}
              value={search.query}
              onChange={(event) => search.onQueryChange(event.target.value)}
              autoFocus
              enterKeyHint="search"
              className="pl-9"
            />
          </div>
          <IconButton variant="ghost" aria-label={search.closeLabel} onClick={search.onClose}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
      </StickyBar>
    )
  }

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
        {search ? (
          <IconButton variant="ghost" aria-label={search.label} onClick={search.onOpen}>
            <Search className="size-5" aria-hidden />
          </IconButton>
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

/** The streak flame: amber + filled once today's goal is met (active), muted outline
 * otherwise, with the running day-streak count. The daily-goal fraction is deliberately
 * dropped — the streak length is the motivating number, and the fill already signals
 * whether today counts. */
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
