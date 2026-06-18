import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useTransform } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Brain, ChevronRight, Flame, Layers, Zap } from 'lucide-react'
import { headerHeight, levelFromXp, type CollapsibleHeader } from '@/shared/lib'
import { Avatar, IconButton, type IconButtonVariant } from '@/shared/ui'

export interface HomeHeaderProps {
  /** Collapse state, owned by the page so its scroll container drives it. */
  header: CollapsibleHeader
  name: string
  /** The user's photo, or null/undefined to fall back to gradient initials. */
  avatar?: string | null
  /** Raw XP — the header derives level and the to-next-level meter from it. */
  xp: number
  unreadCount: number
  streakCount?: number
  dueCount?: number
  /** Show the at-a-glance streak/due chips (hidden on first run). */
  showStats?: boolean
  onOpenProfile: () => void
  onOpenNotifications: () => void
  /** Open the Streak screen from the streak chip. */
  onOpenStreak: () => void
}

/** The home's chrome, pinned above the scroll container so the content scrolls below it
 * while the header itself stays put. A large hero (avatar → profile, greeting, level pill,
 * XP, and the at-a-glance chips — a tappable streak that opens the Streak screen, plus
 * due-today) collapses **in place** as you scroll: the pinned header's height shrinks from
 * the hero's measured height to the compact bar's, while the two crossfade. The layers are
 * absolutely positioned so they overlap during the fade; the header's height is driven
 * explicitly (interpolated px, not a CSS grid `fr` track, which doesn't shrink smoothly
 * when set per scroll frame). Mirrors the old ProgressHeader. */
export function HomeHeader({
  header,
  name,
  avatar,
  xp,
  unreadCount,
  streakCount = 0,
  dueCount = 0,
  showStats = false,
  onOpenProfile,
  onOpenNotifications,
  onOpenStreak,
}: HomeHeaderProps) {
  const { t } = useTranslation()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const levelLabel = t('home.levelShort', { level })
  const fill = Math.round((xpInLevel / xpForNextLevel) * 100)
  const xpToNext = t('home.xpToNext', { remaining: xpForNextLevel - xpInLevel, next: level + 1 })

  const heroRef = useRef<HTMLDivElement>(null)
  const compactRef = useRef<HTMLDivElement>(null)
  const [heroH, setHeroH] = useState(0)
  const [compactH, setCompactH] = useState(0)

  // Collapse progress 0 (hero) → 1 (compact): the hero's opacity already encodes it. The
  // pinned header's height interpolates between the two measured layer heights. The hero
  // and compact layers crossfade on the hook's own curves (hero leads out, compact follows
  // in) so the two avatar/bell sets never sit at half-opacity together.
  const progress = useTransform(header.heroOpacity, (o) => 1 - o)
  const height = useTransform(progress, (p) => headerHeight(p, heroH, compactH))

  // Measure both layers so the header can shrink between their real heights. They're
  // absolutely positioned (to crossfade in place), so the header owns no intrinsic height
  // and must be driven explicitly. A ResizeObserver keeps the heights honest as content
  // (stats row, name length, font scaling) changes.
  useLayoutEffect(() => {
    const measure = () => {
      if (heroRef.current) setHeroH(heroRef.current.offsetHeight)
      if (compactRef.current) setCompactH(compactRef.current.offsetHeight)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    if (heroRef.current) observer.observe(heroRef.current)
    if (compactRef.current) observer.observe(compactRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.header style={{ height }} className="relative shrink-0 overflow-hidden">
      {/* Compact bar — crossfades in as the hero recedes. */}
      <motion.div
        ref={compactRef}
        style={{ opacity: header.compactOpacity, pointerEvents: header.compactPointerEvents }}
        className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 border-b border-border bg-card-glass px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] shadow-rest"
      >
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t('home.openProfile')}
          className="flex min-w-0 items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
        >
          <Avatar
            name={name}
            src={avatar}
            className="size-9 border border-[color:var(--border)] text-[length:var(--p-text-label)]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[length:var(--p-text-label)] font-semibold leading-tight text-heading">
              {name}
            </span>
            <span className="mt-1 flex items-center gap-1.5">
              <span className="text-[length:var(--p-text-tiny)] font-semibold leading-none text-primary">
                {levelLabel}
              </span>
              <span
                className="h-1 w-12 overflow-hidden rounded-full bg-secondary/40"
                role="img"
                aria-label={xpToNext}
              >
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${fill}%` }}
                />
              </span>
            </span>
          </span>
        </button>
        <NotificationButton
          variant="tint"
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
      </motion.div>

      {/* Hero — crossfades out. Rendered last so it sits on top and stays interactive while
          expanded. */}
      <motion.div
        ref={heroRef}
        style={{
          opacity: header.heroOpacity,
          scale: header.heroScale,
          pointerEvents: header.heroPointerEvents,
        }}
        className="absolute inset-x-0 top-0 origin-top px-5 pt-[calc(env(safe-area-inset-top)+1.75rem)]"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={t('home.openProfile')}
            className="flex min-w-0 items-center gap-3 text-left transition-transform active:scale-[0.99]"
          >
            <span className="relative shrink-0">
              <Avatar
                name={name}
                src={avatar}
                className="size-14 border-2 border-[color:var(--surface)] text-[length:var(--p-text-headline)] shadow-rest"
              />
              {/* The "trained mind" mark — Mindscape's signature identity touch. The
                  surface-colored disc gives the white ring (and themes: white in light,
                  dark surface in dark); accent-foreground keeps the icon white in both. */}
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-[var(--surface)] p-[2.5px] shadow-rest"
              >
                <span className="grid size-[18px] place-items-center rounded-full bg-gradient-to-br from-success to-[color:var(--success-foreground)] text-accent-foreground">
                  <Brain className="size-3" strokeWidth={2.5} />
                </span>
              </span>
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex min-w-0 items-center gap-2">
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="truncate"
                >
                  {t('home.hi', { name })}
                </motion.h1>
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </span>
            </span>
          </button>
          <NotificationButton
            variant="glass"
            unreadCount={unreadCount}
            label={t('notifications.openLabel')}
            onClick={onOpenNotifications}
          />
        </div>

        {showStats ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="mt-3 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={onOpenStreak}
              aria-label={t('home.openStreak')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-surface)] py-1 pl-3 pr-2 text-[length:var(--p-text-label)] font-semibold text-[var(--warning-foreground)] transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Flame className="size-3.5" fill="currentColor" aria-hidden />
              {t('home.streakChip', { count: streakCount })}
              <ChevronRight className="size-3.5 opacity-70" aria-hidden />
            </button>
            {dueCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[length:var(--p-text-label)] font-semibold text-primary-foreground">
                <Layers className="size-3.5" aria-hidden />
                {t('home.dueToday', { count: dueCount })}
              </span>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.header>
  )
}

function NotificationButton({
  unreadCount,
  label,
  onClick,
  variant,
}: {
  unreadCount: number
  label: string
  onClick: () => void
  variant: IconButtonVariant
}) {
  const Icon = unreadCount > 0 ? BellRing : Bell
  return (
    <div className="relative shrink-0">
      <IconButton variant={variant} aria-label={label} onClick={onClick}>
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
