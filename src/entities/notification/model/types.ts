import type { Entity } from '@/shared/lib'

/** The milestones worth keeping in the in-app history (distinct from transient toasts). */
export type NotificationType = 'level-up' | 'streak' | 'quiz'

/**
 * One entry in the persistent notification history. Named `AppNotification` to avoid
 * shadowing the DOM `Notification` global. Only the milestone *params* are stored
 * (`level`/`count`/`accuracy`); the human copy is rendered via i18n at display time,
 * so history stays language-neutral.
 */
export interface AppNotification extends Entity {
  type: NotificationType
  read: boolean
  /** XP awarded alongside the milestone, when relevant. */
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

/** Bound on the persisted history; older entries are pruned as new ones arrive. */
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
