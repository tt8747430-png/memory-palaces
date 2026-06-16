import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Trash2 } from 'lucide-react'
import {
  selectNotifications,
  selectUnreadCount,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import {
  clearNotifications,
  markAllNotificationsRead,
  removeNotification,
} from '@/features/notification'
import { NotificationsPanel } from '@/widgets/notifications-panel'
import { AppScreen, OverflowMenuButton, ScreenHeader, type SheetAction } from '@/shared/ui'

export interface NotificationsPageProps {
  /** Provided by the route wrapper so the page stays router-free. */
  onBack?: () => void
}

/** Notification history — the in-app log of milestones (level-ups, streaks, best
 * quizzes), distinct from the transient toasts. Opening the page counts as seeing
 * them, so the unread badge clears once they've loaded. */
export function NotificationsPage({ onBack }: NotificationsPageProps = {}) {
  const { t } = useTranslation()
  const store = useNotificationStoreApi()
  const notifications = useNotificationStore(selectNotifications)
  const unreadCount = useNotificationStore(selectUnreadCount)
  const count = notifications.length

  useEffect(() => {
    store.getState().start()
  }, [store])

  useEffect(() => {
    if (unreadCount > 0) void markAllNotificationsRead(store)
  }, [unreadCount, store])

  const handleRemove = (id: string) => void removeNotification(store, id)
  const handleClearAll = () => void clearNotifications(store)

  const overflowActions: SheetAction[] = [
    {
      id: 'read',
      label: t('notifications.markAllRead'),
      icon: <CheckCheck className="size-5" aria-hidden />,
      onSelect: () => void markAllNotificationsRead(store),
    },
    {
      id: 'clear',
      label: t('notifications.clearAll'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: handleClearAll,
    },
  ]

  return (
    <AppScreen className="pt-safe">
      <ScreenHeader
        title={t('notifications.title')}
        subtitle={
          count > 0
            ? t(count === 1 ? 'notifications.countOne' : 'notifications.countOther', { count })
            : undefined
        }
        onBack={onBack}
        backLabel={t('notifications.back')}
        action={
          notifications.length > 0 ? (
            <OverflowMenuButton
              variant="glass"
              label={t('common.moreOptions')}
              title={t('common.options')}
              actions={overflowActions}
              cancelLabel={t('common.cancel')}
            />
          ) : null
        }
      />
      <div className="mt-2 pb-28">
        <NotificationsPanel
          notifications={notifications}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
        />
      </div>
    </AppScreen>
  )
}
