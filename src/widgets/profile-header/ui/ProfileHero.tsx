import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, Flame, Zap } from 'lucide-react'
import { cn, EASE_OUT, levelFromXp } from '@/shared/lib'
import { Avatar, Progress } from '@/shared/ui'

export interface ProfileHeroProps {
  name: string
  username: string
  avatar?: string | null
  xp: number
  streakCount: number
  deckCount: number
  joinedYear: number | null
  onEditProfile: () => void
  onOpenStreak: () => void
}

export function ProfileHero({
  name,
  username,
  avatar,
  xp,
  streakCount,
  deckCount,
  joinedYear,
  onEditProfile,
  onOpenStreak,
}: ProfileHeroProps) {
  const { t } = useTranslation()
  const handle = username || 'you'
  const { level, fill, remaining } = levelFromXp(xp)
  const levelLabel = t('progress.level', { level })
  const xpToNext = t('progress.xpToNext', { remaining, level: level + 1 })
  const subtitle =
    joinedYear != null
      ? t('profile.handleJoined', { handle, year: joinedYear })
      : t('profile.handle', { handle })

  return (
    <div className="flex flex-col items-center pt-5 text-center">
      <motion.button
        type="button"
        onClick={onEditProfile}
        aria-label={t('profile.editPhoto')}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 translate-y-2.5 scale-95 rounded-full opacity-30 blur-2xl"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
        />
        <span
          aria-hidden
          className="absolute -inset-1.75 rounded-full bg-card-glass shadow-featured ring-1 ring-(--border-glass)"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1.75 rounded-full
          bg-linear-to-br from-white/55 via-white/10 to-transparent"
        />
        <Avatar
          name={name}
          src={avatar}
          className="relative size-26 rounded-full border-[3px] border-white/70 text-glyph-3xl shadow-featured"
        />
      </motion.button>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="mt-4
        text-body font-medium text-muted-foreground"
      >
        {subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: EASE_OUT }}
        className="mt-5 flex w-full max-w-75 items-stretch divide-x divide-border"
      >
        <Stat
          icon={<Flame className="size-4 text-warning" fill="currentColor" aria-hidden />}
          value={String(streakCount)}
          label={t('profile.tiles.currentStreak')}
          onClick={onOpenStreak}
          actionLabel={t('profile.openStreak')}
        />
        <Stat
          icon={<Zap className="size-4 text-warning" fill="currentColor" aria-hidden />}
          value={xp.toLocaleString()}
          label={t('profile.tiles.totalXp')}
        />
        <Stat
          icon={<Building2 className="size-4 text-primary" aria-hidden />}
          value={String(deckCount)}
          label={t('profile.tiles.decks')}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.35, ease: EASE_OUT }}
        className="mt-6 w-full max-w-75"
      >
        <div className="flex items-baseline justify-between text-label font-semibold">
          <span className="text-primary">{levelLabel}</span>
          <span className="text-muted-foreground">{xpToNext}</span>
        </div>
        <Progress value={fill} className="mt-2 h-2.5" label={xpToNext} />
      </motion.div>
    </div>
  )
}

function Stat({
  icon,
  value,
  label,
  onClick,
  actionLabel,
}: {
  icon: ReactNode
  value: string
  label: string
  onClick?: () => void
  actionLabel?: string
}) {
  const figure = (
    <span className="flex items-center gap-1.5">
      {icon}
      <span className="text-headline font-bold leading-none tabular-nums text-heading">
        {value}
      </span>
    </span>
  )

  if (!onClick) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2">
        {figure}
        <span className="text-tiny font-medium text-muted-foreground">{label}</span>
      </div>
    )
  }

  // The one stat that opens a screen wears a control's surface — the glass and hairline of the
  // avatar ring above it, so it lifts off the row without shouting over its neighbours — and a
  // chevron saying where the press goes. The figures stay level with the other two.
  return (
    <div className="flex flex-1 px-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1.5 rounded-card px-2 py-2.5',
          // A border, not a ring: `shadow-rest` writes `box-shadow` outright and would erase one.
          'border border-(--border-glass) bg-card-glass shadow-rest',
          'transition-[transform,background-color] duration-150 ease-out hover:bg-info-surface active:scale-[0.96]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        )}
      >
        {figure}
        <span className="flex items-center gap-0.5 text-tiny font-medium text-muted-foreground">
          {label}
          <ChevronRight className="size-3" strokeWidth={2.5} aria-hidden />
        </span>
      </button>
    </div>
  )
}
