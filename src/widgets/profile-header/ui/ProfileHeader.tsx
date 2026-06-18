import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Camera, Settings } from 'lucide-react'
import { levelFromXp, type CollapsibleHeader } from '@/shared/lib'
import { Avatar, IconButton, type IconButtonVariant } from '@/shared/ui'

export interface ProfileHeaderProps {
  /** Collapse state, owned by the page so its scroll container drives it. */
  header: CollapsibleHeader
  name: string
  /** Handle shown under the name (no leading @). */
  username: string
  /** The user's photo, or null/undefined to fall back to gradient initials. */
  avatar?: string | null
  /** Raw XP — the header derives level and the to-next-level meter from it. */
  xp: number
  /** Year the account was created, or null when unknown. */
  joinedYear: number | null
  unreadCount: number
  onOpenSettings: () => void
  onOpenNotifications: () => void
  /** Tap the avatar to edit the profile photo. */
  onEditProfile: () => void
}

/** The profile's chrome: a large centered hero (104px avatar that taps to edit, name,
 * @handle · joined, and the XP-to-next meter) that recedes on scroll while a compact
 * sticky bar fades in. The top-right carries the notifications bell and the settings
 * gear. Parallax + reduced-motion handled by useCollapsibleHeader. */
export function ProfileHeader({
  header,
  name,
  username,
  avatar,
  xp,
  joinedYear,
  unreadCount,
  onOpenSettings,
  onOpenNotifications,
  onEditProfile,
}: ProfileHeaderProps) {
  const { t } = useTranslation()
  const { level, xpInLevel, xpForNextLevel } = levelFromXp(xp)
  const fill = Math.round((xpInLevel / xpForNextLevel) * 100)
  const levelLabel = t('progress.level', { level })
  const xpToNext = t('progress.xpToNext', { remaining: xpForNextLevel - xpInLevel, level: level + 1 })
  const subtitle =
    joinedYear != null
      ? t('profile.handleJoined', { handle: username || 'you', year: joinedYear })
      : t('profile.handle', { handle: username || 'you' })

  const actions = (variant: IconButtonVariant) => (
    <div className="flex shrink-0 items-center gap-1.5">
      <NotificationButton
        variant={variant}
        unreadCount={unreadCount}
        label={t('notifications.openLabel')}
        onClick={onOpenNotifications}
      />
      <IconButton variant={variant} aria-label={t('profile.openSettings')} onClick={onOpenSettings}>
        <Settings className="size-5" aria-hidden />
      </IconButton>
    </div>
  )

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
            <span className="mt-0.5 block truncate text-[length:var(--p-text-tiny)] font-semibold text-primary">
              {levelLabel}
            </span>
          </span>
        </div>
        {actions('tint')}
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
        <div className="flex justify-end">{actions('glass')}</div>

        <div className="flex flex-col items-center text-center">
          <motion.button
            type="button"
            onClick={onEditProfile}
            aria-label={t('profile.editPhoto')}
            whileTap={{ scale: 0.97 }}
            className="relative rounded-card-featured focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
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
            <span
              aria-hidden
              className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-[3px] border-[color:var(--surface)] text-primary-foreground shadow-interactive"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
            >
              <Camera className="size-4" aria-hidden />
            </span>
          </motion.button>

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
              <span className="text-primary">{levelLabel}</span>
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
