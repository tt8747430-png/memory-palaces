import { Injectable, InjectionToken, computed, inject } from '@angular/core'
import { CollectionStore } from '@app/shared/data/collection-store'
import type { Repository } from '@app/shared/data'
import type { AppNotification } from '../model/notification'
import type { RxJsonSchema } from 'rxdb'

export const NOTIFICATION_REPOSITORY = new InjectionToken<Repository<AppNotification>>(
  'NOTIFICATION_REPOSITORY',
)

@Injectable({ providedIn: 'root' })
export class NotificationStore extends CollectionStore<AppNotification> {
  protected readonly repo = inject(NOTIFICATION_REPOSITORY)
  protected override readonly compare = (a: AppNotification, b: AppNotification): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly notifications = this.entities
  readonly unreadCount = computed(() =>
    this.entities().reduce((count, n) => (n.read ? count : count + 1), 0),
  )
}

export const notificationSchema: RxJsonSchema<AppNotification> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    type: { type: 'string', enum: ['level-up', 'streak', 'quiz'] },
    read: { type: 'boolean' },
    xpGain: { type: 'number' },
    level: { type: 'number' },
    count: { type: 'number' },
    accuracy: { type: 'number' },
  },
  required: ['id', 'createdAt', 'updatedAt', 'type', 'read'],
}
