import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Building2, Camera, Flame, Zap } from 'lucide-react'
import { levelFromXp } from '@/shared/lib'
import { Avatar } from '@/shared/ui'

export interface ProfileHeroProps {
  name: string
  /** Handle shown under the avatar (no leading @). */
  username: string
  /** The user's photo, or null/undefined to fall back to gradient initials. */
  avatar?: string | null
  /** Raw XP — shown in the stat triple and the level meter. */
  xp: number
  /** Current day streak — the streak stat taps through to the Streak screen. */
  streakCount: number
  /** How many palaces the user has built. */
  palaceCount: number
  /** Year the account was created, or null when unknown. */
  joinedYear: number | null
  /** Tap the avatar to edit the profile photo. */
  onEditProfile: () => void
  /** Open the Streak screen from the streak stat. */
  onOpenStreak: () => void
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** The centered profile hero that scrolls beneath the fixed bar: a circular avatar that
 * taps to edit the photo, the @handle · joined line, a three-stat headline (streak · XP ·
 * palaces), and the level / XP-to-next meter. */
export function ProfileHero({
  name,
  username,
  avatar,
  xp,
  streakCount,
  palaceCount,
  joinedYear,
  onEditProfile,
  onOpenStreak,
}: ProfileHeroProps) {
  const { t } = useTranslation()
  const handle = username || 'you'
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round((xpInLevel / xpForNextLevel) * 100)
  const levelLabel = t('progress.level', { level })
  const xpToNext = t('progress.xpToNext', { remaining: xpForNextLevel - xpInLevel, level: level + 1 })
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
        whileTap={{ scale: 0.97 }}
        className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          aria-hidden
          className="absolute inset-0 translate-y-2 scale-90 rounded-full opacity-25 blur-xl"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
        />
        <Avatar
          name={name}
          src={avatar}
          className="relative size-[104px] rounded-full border-[3px] border-[color:var(--surface)] text-[40px] shadow-featured"
        />
        <span
          aria-hidden
          className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full border-[3px] border-[color:var(--surface)] text-primary-foreground shadow-interactive"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
        >
          <Camera className="size-4" aria-hidden />
        </span>
      </motion.button>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="mt-4 text-[length:var(--p-text-sub)] font-medium text-muted-foreground"
      >
        {subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: EASE_OUT }}
        className="mt-5 flex w-full max-w-[300px] items-stretch divide-x divide-border"
      >
        <Stat
          icon={<Flame className="size-4 text-[var(--warning)]" fill="currentColor" aria-hidden />}
          value={String(streakCount)}
          label={t('profile.tiles.currentStreak')}
          onClick={onOpenStreak}
          actionLabel={t('profile.openStreak')}
        />
        <Stat
          icon={<Zap className="size-4 text-[var(--warning)]" fill="currentColor" aria-hidden />}
          value={xp.toLocaleString()}
          label={t('profile.tiles.totalXp')}
        />
        <Stat
          icon={<Building2 className="size-4 text-primary" aria-hidden />}
          value={String(palaceCount)}
          label={t('profile.tiles.palaces')}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.35, ease: EASE_OUT }}
        className="mt-6 w-full max-w-[300px]"
      >
        <div className="flex items-baseline justify-between text-[length:var(--p-text-label)] font-semibold">
          <span className="text-primary">{levelLabel}</span>
          <span className="text-muted-foreground">{xpToNext}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-primary/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }}
          />
        </div>
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
  const body = (
    <>
      <span className="flex items-center gap-1.5">
        {icon}
        <span className="text-[length:var(--p-text-headline)] font-bold leading-none tabular-nums text-heading">
          {value}
        </span>
      </span>
      <span className="text-[length:var(--p-text-tiny)] font-medium text-muted-foreground">
        {label}
      </span>
    </>
  )
  const className = 'flex flex-1 flex-col items-center justify-center gap-1.5 px-2'
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className={`${className} rounded-control transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
    >
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
