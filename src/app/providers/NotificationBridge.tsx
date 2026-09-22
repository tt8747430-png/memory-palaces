import { useEffect } from 'react'
import { useEventBus } from '@/shared/lib'
import { type Milestone, useNotificationStoreApi } from '@/entities/notification'
import { recordNotification } from '@/features/notification'

export function NotificationBridge() {
  const bus = useEventBus()
  const store = useNotificationStoreApi()

  useEffect(() => {
    const record = (milestone: Milestone) => {
      recordNotification(store, milestone).catch((error: unknown) =>
        console.error('A milestone could not be written down', error),
      )
    }
    const offs = [
      bus.on('level-up', ({ level }) => record({ type: 'level-up', level })),
      bus.on('streak', ({ count }) => record({ type: 'streak', count })),
      bus.on('quiz', ({ accuracy, xp }) => record({ type: 'quiz', accuracy, xpGain: xp })),
    ]
    return () => {
      for (const off of offs) off()
    }
  }, [bus, store])

  return null
}
