import { useEffect } from 'react'
import { useEventBus } from '@/shared/lib'
import { useNotificationStoreApi } from '@/entities/notification'
import { recordNotification } from '@/features/notification'

export function NotificationBridge() {
  const bus = useEventBus()
  const store = useNotificationStoreApi()

  useEffect(() => {
    store.getState().start()
    const offs = [
      bus.on('level-up', ({ level }) => {
        void recordNotification(store, { type: 'level-up', level })
      }),
      bus.on('streak', ({ count }) => {
        void recordNotification(store, { type: 'streak', count })
      }),
      bus.on('quiz', ({ accuracy, xp }) => {
        void recordNotification(store, { type: 'quiz', accuracy, xpGain: xp })
      }),
    ]
    return () => {
      for (const off of offs) off()
    }
  }, [bus, store])

  return null
}
