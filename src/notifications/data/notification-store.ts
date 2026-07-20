import { CollectionStore } from '@/shared/data/collection-store'
import { derived } from '@/shared/data/observable'
import type { Repository } from '@/shared/data'
import type { AppNotification } from '../model/notification'
import type { RxJsonSchema } from 'rxdb'

export class NotificationStore extends CollectionStore<AppNotification> {
  protected override readonly compare = (a: AppNotification, b: AppNotification): number =>
    b.createdAt.localeCompare(a.createdAt)
  readonly notifications = this.entities
  readonly unreadCount = derived(this.entities, (list) =>
    list.reduce((count, n) => (n.read ? count : count + 1), 0),
  )

  constructor(repo: Repository<AppNotification>) {
    super(repo)
  }
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
