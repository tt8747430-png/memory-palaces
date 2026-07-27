import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { HeaderBar, IconButton, NotificationBell } from '@/shared/ui'

export interface ProfileBarProps {
  name: string
  unreadCount: number
  onOpenNotifications: () => void
  onOpenSettings: () => void
}

export function ProfileBar({
  name,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
}: ProfileBarProps) {
  const { t } = useTranslation()
  return (
    <HeaderBar>
      <h1 className="min-w-0 flex-1 truncate pl-3">{name}</h1>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell
          unreadCount={unreadCount}
          label={t('notifications.openLabel')}
          onClick={onOpenNotifications}
        />
        <IconButton variant="glass" aria-label={t('profile.openSettings')} onClick={onOpenSettings}>
          <Settings className="size-5" aria-hidden />
        </IconButton>
      </div>
    </HeaderBar>
  )
}
