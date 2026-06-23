import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Flame, Search, X, Zap } from 'lucide-react'
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
  /** Raw XP — the bar derives the level pill from it. */
  xp: number
  unreadCount: number
  onOpenProfile: () => void
  onOpenNotifications: () => void
  /** Optional inline search; when provided, a search button joins the bell and can take
   * over the whole bar. Omit it for surfaces that don't search. */
  search?: HomeHeaderSearch
  /** Live streak count + today's progress toward the goal; omit to hide the ring. */
  streak?: { count: number; dayCount: number; dailyGoal: number }
  onOpenStreak?: () => void
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** The home's chrome: one slim, persistent bar that greets by name. The avatar and
 * greeting tap through to the profile; a level pill carries progress at a glance and the
 * bell opens notifications. The bar is transparent at the top (merging into the daylight
 * ground) and gains a glass edge as the page scrolls under it. The day's stats live in
 * the cards below, so the bar stays calm. */
export function HomeHeader({
  header,
  name,
  avatar,
  xp,
  unreadCount,
  onOpenProfile,
  onOpenNotifications,
  search,
  streak,
  onOpenStreak,
}: HomeHeaderProps) {
  const { t } = useTranslation()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const levelLabel = t('home.levelShort', { level })
  const fill = Math.round((xpInLevel / xpForNextLevel) * 100)
  const xpToNext = t('home.xpToNext', { remaining: xpForNextLevel - xpInLevel, next: level + 1 })

  if (search?.open) {
    return (
      <StickyBar elevation={header.elevation}>
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
    <StickyBar elevation={header.elevation}>
      <button
        type="button"
        onClick={onOpenProfile}
        aria-label={t('home.openProfile')}
        className="flex min-w-0 items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
      >
        <Avatar
          name={name}
          src={avatar}
          className="size-10 border border-[color:var(--border)] text-[length:var(--p-text-sub)]"
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="truncate text-[length:var(--p-text-title)] font-bold leading-tight tracking-tight text-heading"
            >
              {t('home.hi', { name })}
            </motion.h1>
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.3, ease: EASE_OUT }}
              className="shrink-0 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-0.5 text-[length:var(--p-text-tiny)] font-semibold text-primary-foreground"
            >
              {levelLabel}
            </motion.span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-flex shrink-0 items-center gap-1 text-[length:var(--p-text-label)] font-semibold text-heading">
              <Zap className="size-3.5 text-[var(--warning)]" fill="currentColor" aria-hidden />
              {t('home.xpTotal', { xp })}
            </span>
            <span
              className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary/40"
              role="img"
              aria-label={xpToNext}
            >
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${fill}%` }}
                transition={{ delay: 0.15, duration: 0.6, ease: EASE_OUT }}
              />
            </span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {streak && onOpenStreak ? (
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
              className={cn(
                'size-4',
                streak.dayCount >= streak.dailyGoal
                  ? 'text-[var(--warning)]'
                  : 'text-muted-foreground',
              )}
              fill={streak.dayCount >= streak.dailyGoal ? 'currentColor' : 'none'}
              aria-hidden
            />
            <span className="tabular-nums">{streak.count}</span>
            <span className="text-[length:var(--p-text-tiny)] tabular-nums text-muted-foreground">
              {streak.dayCount}/{streak.dailyGoal}
            </span>
          </button>
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
      </div>
    </StickyBar>
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
