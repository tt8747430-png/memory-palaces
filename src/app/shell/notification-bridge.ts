import { Injectable, inject } from '@angular/core'
import { EVENT_BUS } from '@app/shared/data/event-bus.token'
import { NotificationStore } from '@app/notifications/data/notification-store'
import { recordNotification } from '@app/notifications/commands/record-notification'

/** Turns gamification events (level-up, streak, quiz) into stored notifications. */
@Injectable({ providedIn: 'root' })
export class NotificationBridge {
  private readonly bus = inject(EVENT_BUS)
  private readonly store = inject(NotificationStore)
  private started = false

  init(): void {
    if (this.started) return
    this.started = true
    this.store.start()
    this.bus.on('level-up', ({ level }) => {
      void recordNotification(this.store, { type: 'level-up', level })
    })
    this.bus.on('streak', ({ count }) => {
      void recordNotification(this.store, { type: 'streak', count })
    })
    this.bus.on('quiz', ({ accuracy, xp }) => {
      void recordNotification(this.store, { type: 'quiz', accuracy, xpGain: xp })
    })
  }
}
