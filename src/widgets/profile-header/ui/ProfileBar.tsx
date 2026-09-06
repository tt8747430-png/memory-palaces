import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import {
  AppHeader,
  HeaderActions,
  HeaderBar,
  HeaderTitle,
  IconButton,
  NotificationBell,
} from '@/shared/ui'

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
    <AppHeader title={name}>
      <HeaderBar>
        <HeaderTitle className="min-w-0 flex-1 pl-3" />
        <HeaderActions>
          <NotificationBell
            unreadCount={unreadCount}
            label={t('notifications.openLabel')}
            onClick={onOpenNotifications}
          />
          <IconButton
            variant="glass"
            aria-label={t('profile.openSettings')}
            onClick={onOpenSettings}
          >
            <Settings className="size-5" aria-hidden />
          </IconButton>
        </HeaderActions>
      </HeaderBar>
    </AppHeader>
  )
}
