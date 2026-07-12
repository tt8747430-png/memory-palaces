import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Settings } from 'lucide-react'
import type { StickyHeader } from '@/shared/lib'
import { IconButton, StickyBar } from '@/shared/ui'

export interface ProfileBarProps {
  header: StickyHeader
  name: string
  unreadCount: number
  onOpenNotifications: () => void
  onOpenSettings: () => void
}

export function ProfileBar({
  header,
  name,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
}: ProfileBarProps) {
  const { t } = useTranslation()
  return (
    <StickyBar elevation={header.elevation}>
      <h1 className="min-w-0 flex-1 truncate text-[length:var(--p-text-title)] font-bold leading-tight text-heading">
        {name}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationButton
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
        <IconButton variant="ghost" aria-label={t('profile.openSettings')} onClick={onOpenSettings}>
          <Settings className="size-5" aria-hidden />
        </IconButton>
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
