import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { levelFromXp, useCollapsibleHeader } from '@/shared/lib'
import { Avatar, IconButton } from '@/shared/ui'

export interface ProfileHeaderProps {
  name: string
  /** The user's photo, or null/undefined to fall back to gradient initials. */
  avatar?: string | null
  /** Raw XP — the header derives level and the to-next-level meter from it. */
  xp: number
  palaceCount: number
  streakCount: number
  onOpenSettings: () => void
}

/** The profile's chrome, mirroring the home header: a large centered hero (104px initials
 * avatar with a navy→accent glow + Lv badge, name, subtitle, and the full XP-to-next bar)
 * that recedes on scroll while a compact sticky bar fades in keeping name, level, and
 * settings reachable. Parallax + reduced-motion handled by useCollapsibleHeader. */
export function ProfileHeader({
  name,
  avatar,
  xp,
  palaceCount,
  streakCount,
  onOpenSettings,
}: ProfileHeaderProps) {
  const { t } = useTranslation()
  const header = useCollapsibleHeader()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round((xpInLevel / xpForNextLevel) * 100)
  const levelLabel = t('progress.level', { level })
  const xpToNext = t('progress.xpToNext', { remaining: xpForNextLevel - xpInLevel, level: level + 1 })
  const subtitle =
    palaceCount > 0
      ? t(palaceCount === 1 ? 'profile.subtitlePalacesOne' : 'profile.subtitlePalacesOther', {
          count: palaceCount,
          streak: streakCount,
        })
      : t('profile.subtitleEmpty')

  return (
    <>
      <motion.div
        style={{ opacity: header.compactOpacity, pointerEvents: header.compactPointerEvents }}
        className="fixed inset-x-0 top-0 z-[100] mx-auto flex max-w-[430px] items-center justify-between gap-3 border-b border-border bg-card-glass px-5 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] shadow-rest"
      >
        <div className="flex min-w-0 items-center gap-2.5">
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
        </div>
        <IconButton variant="tint" aria-label={t('profile.openSettings')} onClick={onOpenSettings}>
          <Settings className="size-5" aria-hidden />
        </IconButton>
      </motion.div>

      <motion.header
        style={{
          opacity: header.heroOpacity,
          scale: header.heroScale,
          y: header.heroY,
          pointerEvents: header.heroPointerEvents,
        }}
        className="origin-top pt-[calc(env(safe-area-inset-top)+1.75rem)]"
      >
        <div className="flex justify-end">
          <IconButton
            variant="glass"
            aria-label={t('profile.openSettings')}
            onClick={onOpenSettings}
          >
            <Settings className="size-5" aria-hidden />
          </IconButton>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="relative">
            <span
              aria-hidden
              className="absolute inset-0 translate-y-2 scale-90 rounded-card-featured opacity-25 blur-xl"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
            />
            <Avatar
              name={name}
              src={avatar}
              className="relative size-[104px] rounded-card-featured border-[3px] border-[color:var(--surface)] text-[40px] shadow-featured"
            />
            <span className="absolute -bottom-2.5 -right-2.5 rounded-control border border-white/30 bg-gradient-to-r from-primary to-accent px-3 py-1 text-[length:var(--p-text-label)] font-bold tracking-wide text-primary-foreground shadow-interactive">
              {t('profile.levelShort', { level })}
            </span>
          </span>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-balance"
          >
            {name}
          </motion.h1>
          <p className="mt-1 text-[length:var(--p-text-sub)] font-medium text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-5 w-full max-w-[280px]">
            <div className="flex justify-between text-[length:var(--p-text-label)] font-semibold text-muted-foreground">
              <span>{levelLabel}</span>
              <span>{xpToNext}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-primary/[0.08]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${fill}%` }}
                transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </motion.header>
    </>
  )
}
