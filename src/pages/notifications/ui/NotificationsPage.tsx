import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import {
  selectNotifications,
  selectUnreadIds,
  useNotificationStore,
  useNotificationStoreApi,
} from '@/entities/notification'
import {
  clearNotifications,
  markAllNotificationsRead,
  removeNotification,
} from '@/features/notification'
import { selectIsReady } from '@/shared/lib'
import { NotificationsPanel } from '@/widgets/notifications-panel'
import { AppScreen, FlyoutMenu, ScreenHeader, ScreenLoading, type SheetAction } from '@/shared/ui'

export interface NotificationsPageProps {
  onBack?: () => void
}

export function NotificationsPage({ onBack }: NotificationsPageProps = {}) {
  const ready = useNotificationStore(selectIsReady)
  // The list below opens on what it finds, so it may not mount until there is something to find.
  if (!ready) return <ScreenLoading />
  return <NotificationsView onBack={onBack} />
}

function NotificationsView({ onBack }: NotificationsPageProps) {
  const { t } = useTranslation()
  const store = useNotificationStoreApi()
  const notifications = useNotificationStore(selectNotifications)
  // Frozen on arrival: opening the screen is the acknowledgement, and the rings must outlive it.
  const [unseen] = useState<ReadonlySet<string>>(() => new Set(selectUnreadIds(store.getState())))
  const count = notifications.length

  useEffect(() => {
    void markAllNotificationsRead(store)
  }, [store])

  const handleRemove = (id: string) => void removeNotification(store, id)
  const handleClearAll = () => void clearNotifications(store)

  const overflowActions: SheetAction[] = [
    {
      id: 'clear',
      label: t('notifications.clearAll'),
      icon: <Trash2 className="size-5" aria-hidden />,
      destructive: true,
      onSelect: handleClearAll,
    },
  ]

  return (
    <AppScreen
      gutter="end"
      header={
        <ScreenHeader
          title={t('notifications.title')}
          subtitle={count > 0 ? t('notifications.count', { count }) : undefined}
          onBack={onBack}
          backLabel={t('notifications.back')}
          action={
            count > 0 ? (
              <FlyoutMenu
                variant="glass"
                size="md"
                label={t('common.moreOptions')}
                actions={overflowActions}
              />
            ) : null
          }
        />
      }
    >
      <div className="mt-2">
        <NotificationsPanel notifications={notifications} unseen={unseen} onRemove={handleRemove} />
      </div>
    </AppScreen>
  )
}
