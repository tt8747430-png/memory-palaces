import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { BellRing } from 'lucide-react'
import { Avatar, IconButton } from '@/shared/ui'
import { useCollapsibleHeader } from '../lib/use-collapsible-header'

export interface HomeHeaderProps {
  name: string
  level: number
  unreadCount: number
  onOpenProfile: () => void
  onOpenNotifications: () => void
}

/** The home's chrome: a large hero (avatar → profile, greeting, level pill, bell)
 * that recedes on scroll while a compact sticky bar fades in keeping profile + bell
 * reachable. Streak/XP live in StreakSummary, so they are not repeated here. */
export function HomeHeader({
  name,
  level,
  unreadCount,
  onOpenProfile,
  onOpenNotifications,
}: HomeHeaderProps) {
  const { t } = useTranslation()
  const header = useCollapsibleHeader()
  const levelLabel = t('home.levelShort', { level })

  return (
    <>
      <motion.div
        style={{ opacity: header.compactOpacity, pointerEvents: header.compactPointerEvents }}
        className="fixed inset-x-0 top-0 z-[180] mx-auto flex max-w-[430px] items-center justify-between gap-3 bg-glass px-5 pt-safe pb-2 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t('home.openProfile')}
          className="flex min-w-0 items-center gap-2.5 text-left transition-transform active:scale-[0.98]"
        >
          <Avatar name={name} className="size-8 text-[length:var(--p-text-label)]" />
          <span className="min-w-0">
            <span className="block truncate text-[length:var(--p-text-label)] font-semibold leading-tight text-heading">
              {name}
            </span>
            <span className="block text-[length:var(--p-text-tiny)] text-muted-foreground">
              {levelLabel}
            </span>
          </span>
        </button>
        <NotificationButton
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
      </motion.div>

      <motion.header
        style={{
          opacity: header.heroOpacity,
          scale: header.heroScale,
          y: header.heroY,
          pointerEvents: header.heroPointerEvents,
        }}
        className="flex origin-top items-center justify-between gap-3 pt-12"
      >
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t('home.openProfile')}
          className="flex min-w-0 items-center gap-3 text-left transition-transform active:scale-[0.99]"
        >
          <Avatar name={name} className="size-14 text-[length:var(--p-text-headline)]" />
          <span className="flex min-w-0 items-center gap-2">
            <h1 className="truncate">{t('home.hi', { name })}</h1>
            <span className="shrink-0 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-0.5 text-[length:var(--p-text-tiny)] font-semibold text-primary-foreground">
              {levelLabel}
            </span>
          </span>
        </button>
        <NotificationButton
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
      </motion.header>
    </>
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
  return (
    <div className="relative shrink-0">
      <IconButton variant="glass" aria-label={label} onClick={onClick}>
        <BellRing className="size-5" aria-hidden />
      </IconButton>
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}
    </div>
  )
}
