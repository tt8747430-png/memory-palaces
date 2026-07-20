import type { Entity } from '@/shared/domain'

export type NotificationType = 'level-up' | 'streak' | 'quiz'

export interface AppNotification extends Entity {
  type: NotificationType
  read: boolean
  xpGain?: number
  level?: number
  count?: number
  accuracy?: number
}

export interface MakeNotificationInput {
  id: string
  createdAt: string
  type: NotificationType
  read?: boolean
  xpGain?: number
  level?: number
  count?: number
  accuracy?: number
}

export const NOTIFICATION_CAP = 40

export function makeNotification(input: MakeNotificationInput): AppNotification {
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    type: input.type,
    read: input.read ?? false,
    xpGain: input.xpGain,
    level: input.level,
    count: input.count,
    accuracy: input.accuracy,
  }
}
