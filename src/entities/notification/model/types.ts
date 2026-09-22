import type { Entity } from '@/shared/lib'

/**
 * What the app congratulates a learner for. One shape per kind, so a milestone carries exactly the
 * numbers its copy needs and no others — a `level-up` has a level, never an accuracy.
 */
export type Milestone =
  | { type: 'level-up'; level: number }
  | { type: 'streak'; count: number }
  | { type: 'quiz'; accuracy: number; xpGain: number }

export type MilestoneType = Milestone['type']

export interface AppNotification extends Entity {
  read: boolean
  milestone: Milestone
}

export interface MakeNotificationInput {
  id: string
  createdAt: string
  milestone: Milestone
  read?: boolean
}

export const NOTIFICATION_CAP = 40

export function makeNotification(input: MakeNotificationInput): AppNotification {
  return {
    id: input.id,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    read: input.read ?? false,
    milestone: validateMilestone(input.milestone),
  }
}

/** A milestone nobody reached is not a milestone: every number it carries must be a real one. */
export function validateMilestone(milestone: Milestone): Milestone {
  switch (milestone.type) {
    case 'level-up':
      if (!Number.isInteger(milestone.level) || milestone.level < 1) {
        throw new Error('Milestone level must be a whole number >= 1')
      }
      return milestone
    case 'streak':
      if (!Number.isInteger(milestone.count) || milestone.count < 1) {
        throw new Error('Milestone streak count must be a whole number >= 1')
      }
      return milestone
    case 'quiz':
      if (
        !Number.isFinite(milestone.accuracy) ||
        milestone.accuracy < 0 ||
        milestone.accuracy > 100
      ) {
        throw new Error('Milestone quiz accuracy must be between 0 and 100')
      }
      if (!Number.isFinite(milestone.xpGain) || milestone.xpGain < 0) {
        throw new Error('Milestone XP gain must be >= 0')
      }
      return milestone
  }
}

/** The XP a milestone earned, for the only kind that carries any. */
export function milestoneXp(milestone: Milestone): number | undefined {
  return milestone.type === 'quiz' && milestone.xpGain > 0 ? milestone.xpGain : undefined
}
